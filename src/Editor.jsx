// React component with Monaco Editor (Frontend only - using eval)
import React, { useState, useRef } from "react";
import Editor from "@monaco-editor/react";

export default function NodePlayground() {
  const [code, setCode] = useState(`console.log('Hello World');`);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);
  const resizableRef = useRef(null);
  const [editorWidth, setEditorWidth] = useState(50);

  const runCode = () => {
    setLoading(true);
    const logs = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    try {
      // Use Function constructor instead of eval for slightly better control
      const result = new Function(code)();
      if (result !== undefined) logs.push(String(result));
      setOutput(logs.join("\n"));
    } catch (err) {
      setOutput("Error: " + err.message);
    }

    console.log = originalConsoleLog;
    setLoading(false);
  };

  const handleMouseDown = (e) => {
    const startX = e.clientX;
    const startWidth = editorWidth;

    const onMouseMove = (e) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(20, Math.min(80, startWidth + (delta * 100) / window.innerWidth));
      setEditorWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode();
    });
  };

  return (
    <div className="flex h-screen">
      <div className="editor-root-container" style={{ width: `${editorWidth}%` }}>
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          ref={editorRef}
          onMount={handleEditorDidMount}
          onChange={(value) => setCode(value || "")}
          options={{ fontSize: 14, minimap: { enabled: false } }}
        />
        <button onClick={runCode} className="running-button">
          {loading ? "Running..." : "Run"}
        </button>
      </div>
      <div
        ref={resizableRef}
        onMouseDown={handleMouseDown}
        className="w-1 bg-gray-500 cursor-col-resize"
        style={{ width: "5px", backgroundColor: "green", cursor: "col-resize" }}
      ></div>
      <div className="output-container">
        <pre>{output}</pre>
      </div>
    </div>
  );
}
