import React, { useState, useRef, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import Topbar from "./components/Topbar";
import OutputPanel from "./components/OutputPanel";
import ResizeDivider from "./components/ResizeDivider";
import { saveScript, getScripts, loadScript } from "./api";
import "./Editor.css";

const DEFAULT_CODE = `// Welcome to NodeBox — your in-browser JS playground
// Press Ctrl+Enter (Cmd+Enter on Mac) to run

function greet(name) {
  return \`Hello, \${name}! 👋\`;
}

console.log(greet("World"));
console.log("Today:", new Date().toLocaleDateString());

const nums = [1, 2, 3, 4, 5];
const sum = nums.reduce((a, b) => a + b, 0);
console.log("Sum of", nums, "=", sum);
`;

export default function NodePlayground() {
  const [code, setCode]             = useState(DEFAULT_CODE);
  const [output, setOutput]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [editorWidth, setEditorWidth] = useState(55);
  const [filename, setFilename]     = useState("main.js");

  const editorRef    = useRef(null);
  const resizableRef = useRef(null);
  const runCodeRef   = useRef(null);

  /* ── Code execution ─────────────────────────────────────── */
  const runCode = useCallback(() => {
    setLoading(true);
    const logs = [];
    const originalConsoleLog = console.log;

    // Capture console.log output
    console.log = (...args) => {
      logs.push(
        args
          .map((a) =>
            typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
          )
          .join(" ")
      );
    };

    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(code)();
      if (result !== undefined) logs.push(String(result));
      setOutput(logs.join("\n"));
    } catch (err) {
      setOutput(`${err.name}: ${err.message}`);
    } finally {
      console.log = originalConsoleLog;
      setLoading(false);
    }
  }, [code]);

  // Keep ref always pointing to latest runCode so the Monaco keybinding
  // (registered once on mount) always calls the current version.
  runCodeRef.current = runCode;

  const handleClearOutput = useCallback(() => setOutput(""), []);

  const handleSave = useCallback(async (name) => {
    const saveName = name.endsWith(".js") ? name : `${name}.js`;
    await saveScript(saveName, code);
    setFilename(saveName);
  }, [code]);

  const handleLoad = useCallback(async (name) => {
    const data = await loadScript(name);
    setFilename(data.name ?? name);
    setCode(data.code ?? "");
  }, []);

  /* ── Resizable split pane ────────────────────────────────── */
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const startX     = e.clientX;
    const startWidth = editorWidth;

    const onMouseMove = (e) => {
      const delta    = e.clientX - startX;
      const newWidth = Math.max(25, Math.min(75, startWidth + (delta * 100) / window.innerWidth));
      setEditorWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [editorWidth]);

  /* ── Monaco mount ────────────────────────────────────────── */
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Use the ref so this callback (registered once) always calls the latest runCode.
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => runCodeRef.current()
    );

    // Custom editor theming applied after mount
    monaco.editor.defineTheme("nodebox-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "5c6370", fontStyle: "italic" },
        { token: "keyword", foreground: "c678dd" },
        { token: "string",  foreground: "98c379" },
        { token: "number",  foreground: "d19a66" },
        { token: "regexp",  foreground: "e06c75" },
      ],
      colors: {
        "editor.background":           "#0d0d10",
        "editor.foreground":           "#abb2bf",
        "editor.lineHighlightBackground": "#1a1a24",
        "editor.selectionBackground":  "#3e4451",
        "editorLineNumber.foreground": "#3c3c50",
        "editorLineNumber.activeForeground": "#7c7c9a",
        "editorIndentGuide.background":"#1e1e2e",
        "editorIndentGuide.activeBackground": "#3c3c50",
        "editorCursor.foreground":     "#7c6af7",
        "scrollbarSlider.background":  "#22222f",
        "scrollbarSlider.hoverBackground":"#2a2a3a",
        "scrollbarSlider.activeBackground":"#3c3c50",
      },
    });

    monaco.editor.setTheme("nodebox-dark");
  }, []);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="playground">
      <Topbar
        filename={filename}
        loading={loading}
        onRun={runCode}
        onSave={handleSave}
        onLoad={handleLoad}
      />

      <main className="playground__body">
        {/* Editor Pane */}
        <section
          className="playground__editor-pane"
          style={{ width: `${editorWidth}%` }}
          aria-label="Code editor"
        >
          <div className="playground__editor-header">
            <span className="playground__editor-tab">
              <span className="playground__editor-tab-dot" />
              main.js
            </span>
          </div>
          <div className="playground__editor-body">
            <MonacoEditor
              height="100%"
              language="javascript"
              theme="nodebox-dark"
              value={code}
              onMount={handleEditorDidMount}
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 13.5,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                renderLineHighlight: "line",
                smoothScrolling: true,
                cursorBlinking: "phase",
                cursorSmoothCaretAnimation: "on",
                padding: { top: 16, bottom: 16 },
                tabSize: 2,
                wordWrap: "on",
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true },
                overviewRulerLanes: 0,
              }}
            />
          </div>
        </section>

        {/* Drag Handle */}
        <ResizeDivider onMouseDown={handleMouseDown} ref={resizableRef} />

        {/* Output Pane */}
        <section
          className="playground__output-pane"
          aria-label="Output panel"
        >
          <OutputPanel output={output} onClear={handleClearOutput} />
        </section>
      </main>
    </div>
  );
}
