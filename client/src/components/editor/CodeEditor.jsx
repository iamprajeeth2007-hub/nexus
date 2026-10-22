import React, { useRef, useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../../store';
import { Play, Loader2, Bot } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const LANG_MAP = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', md: 'markdown', css: 'css', html: 'html', json: 'json'
};

export default function CodeEditor({ editorSocket }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const isRemoteUpdate = useRef(false);
  const changeTimeout = useRef(null);

  const { files, activeFile, remoteCursors, user, removeRemoteCursor } = useStore();
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [running, setRunning] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const currentFile = files[activeFile];
  const ext = activeFile?.split('.').pop() || 'js';
  const language = currentFile?.language || LANG_MAP[ext] || 'javascript';

  // When active file changes, update editor content
  useEffect(() => {
    if (!editorRef.current || !currentFile) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const current = model.getValue();
    if (current !== currentFile.content) {
      isRemoteUpdate.current = true;
      const pos = editorRef.current.getPosition();
      model.setValue(currentFile.content);
      if (pos) editorRef.current.setPosition(pos);
      isRemoteUpdate.current = false;
    }
  }, [activeFile, currentFile?.version]);

  // Render remote cursors as decorations
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const newDecorations = Object.values(remoteCursors)
      .filter(c => c.position)
      .map(cursor => ({
        range: new monaco.Range(cursor.position.lineNumber, cursor.position.column, cursor.position.lineNumber, cursor.position.column),
        options: {
          className: `remote-cursor-${cursor.userId.slice(0, 8)}`,
          glyphMarginClassName: '',
          hoverMessage: { value: cursor.userName },
          afterContentClassName: `remote-cursor-label`,
          stickiness: 1,
          before: {
            content: ' ',
            inlineClassName: `cursor-line cursor-${cursor.userId.slice(0, 8)}`,
          }
        }
      }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);

    // Inject CSS for this cursor color
    Object.values(remoteCursors).forEach(cursor => {
      const id = cursor.userId.slice(0, 8);
      const styleId = `cursor-style-${id}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .cursor-${id} { border-left: 2px solid ${cursor.color}; margin-left: -1px; }
          .remote-cursor-${id}::after { content: '${cursor.userName}'; background: ${cursor.color}; color: #000; font-size: 9px; padding: 0 3px; border-radius: 2px; position: absolute; top: -16px; white-space: nowrap; z-index: 100; }
        `;
        document.head.appendChild(style);
      }
    });
  }, [remoteCursors]);

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Monaco dark theme matching NEXUS
    monaco.editor.defineTheme('nexus', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4a4a6a', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'a855f7' },
        { token: 'string', foreground: '00f5c4' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'function', foreground: '60a5fa' },
        { token: 'variable', foreground: 'c8c8d8' },
        { token: 'type', foreground: '34d399' },
      ],
      colors: {
        'editor.background': '#0a0a0f',
        'editor.foreground': '#c8c8d8',
        'editorLineNumber.foreground': '#2e2e4e',
        'editorLineNumber.activeForeground': '#4a4a6a',
        'editor.selectionBackground': '#a855f722',
        'editor.lineHighlightBackground': '#0f0f1700',
        'editorCursor.foreground': '#00f5c4',
        'editor.findMatchBackground': '#00f5c422',
        'editorWidget.background': '#0f0f17',
        'editorWidget.border': '#1e1e2e',
        'editorSuggestWidget.background': '#0f0f17',
        'editorSuggestWidget.border': '#1e1e2e',
        'editorSuggestWidget.selectedBackground': '#1e1e2e',
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#1e1e2e88',
        'scrollbarSlider.hoverBackground': '#2e2e4e',
      }
    });
    monaco.editor.setTheme('nexus');

    if (currentFile) editor.setValue(currentFile.content || '');
  }, []);

  const handleChange = useCallback((value) => {
    if (isRemoteUpdate.current || value === undefined) return;
    const { activeFile } = useStore.getState();

    // Throttle: send after 150ms of no typing
    clearTimeout(changeTimeout.current);
    changeTimeout.current = setTimeout(() => {
      editorSocket.sendCodeChange(activeFile, value);
    }, 150);
  }, []);

  const handleCursorChange = useCallback((e) => {
    if (!e?.position) return;
    const { activeFile } = useStore.getState();
    editorSocket.sendCursorMove(activeFile, e.position, null);
  }, []);

  // Run code (JavaScript only, sandboxed)
  function runCode() {
    if (!currentFile) return;
    setRunning(true);
    setShowOutput(true);
    const logs = [];
    const sandbox = {
      console: { log: (...a) => logs.push(a.map(String).join(' ')), error: (...a) => logs.push('ERROR: ' + a.join(' ')), warn: (...a) => logs.push('WARN: ' + a.join(' ')) },
      setTimeout: () => {}, setInterval: () => {}
    };
    try {
      const fn = new Function(...Object.keys(sandbox), currentFile.content);
      fn(...Object.values(sandbox));
      setOutput(logs.join('\n') || '(no output)');
    } catch (err) {
      setOutput('Error: ' + err.message);
    }
    setRunning(false);
  }

  // AI suggest
  async function getAISuggestion() {
    if (!currentFile) return;
    setAiLoading(true);
    try {
      const { data } = await axios.post(`${SERVER}/api/ai/suggest`, {
        code: currentFile.content.slice(0, 3000),
        language,
        prompt: 'Suggest an improvement or next step'
      });
      if (data.suggestion) {
        toast.success('AI suggestion ready — check console', { style: toastStyle });
        setOutput(data.suggestion);
        setShowOutput(true);
      } else if (data.error) {
        toast.error(data.error, { style: toastStyle });
      }
    } catch {
      toast.error('AI unavailable', { style: toastStyle });
    }
    setAiLoading(false);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-nexus-surface border-b border-nexus-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-nexus-text">{activeFile}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-nexus-teal/10 text-nexus-teal border border-nexus-teal/20">LIVE</span>
          <span className="text-[9px] text-nexus-muted">{language}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={getAISuggestion} disabled={aiLoading}
            title="AI Suggest"
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-nexus-purple border border-nexus-purple/20 hover:bg-nexus-purple/10 transition-colors disabled:opacity-50">
            {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Bot size={10} />}
            AI
          </button>
          {language === 'javascript' && (
            <button onClick={runCode} disabled={running}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-nexus-teal border border-nexus-teal/25 hover:bg-nexus-teal/10 transition-colors">
              {running ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
              Run
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Editor
          language={language}
          theme="nexus"
          onChange={handleChange}
          onMount={handleEditorMount}
          onCursorPositionChange={handleCursorChange}
          options={{
            fontSize: 13,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontLigatures: true,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'none',
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            renderWhitespace: 'none',
            bracketPairColorization: { enabled: true },
            suggest: { preview: true },
          }}
        />
      </div>

      {/* Output panel */}
      {showOutput && (
        <div className="h-32 flex-shrink-0 border-t border-nexus-border bg-nexus-bg">
          <div className="flex items-center justify-between px-3 py-1 border-b border-nexus-border">
            <span className="text-[10px] text-nexus-muted">Output</span>
            <button onClick={() => setShowOutput(false)} className="text-nexus-muted hover:text-nexus-text text-[10px]">✕</button>
          </div>
          <div className="p-3 overflow-y-auto h-24 font-mono text-[11px] text-nexus-text whitespace-pre-wrap scrollbar-none">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}

const toastStyle = {
  background: '#13131e', color: '#c8c8d8',
  border: '1px solid #1e1e2e', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px'
};
