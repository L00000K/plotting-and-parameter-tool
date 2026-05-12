import { useRef, useEffect, useMemo } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { EditorState } from '@codemirror/state';

interface Props {
  value: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
  height?: string;
}

// Light theme for CodeMirror
const lightTheme = EditorView.theme({
  '&': { backgroundColor: '#ffffff', color: '#1e293b' },
  '.cm-content': { caretColor: '#3b82f6' },
  '.cm-gutters': { backgroundColor: '#f8fafc', color: '#94a3b8', border: 'none', borderRight: '1px solid #e2e8f0' },
  '.cm-activeLineGutter': { backgroundColor: '#eff6ff' },
  '.cm-activeLine': { backgroundColor: '#eff6ff' },
  '.cm-selectionBackground': { backgroundColor: '#bfdbfe !important' },
  '.cm-cursor': { borderLeftColor: '#3b82f6' },
}, { dark: false });

export function EquationEditor({ value, onChange, readOnly = false, height = '200px' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const extensions = useMemo(() => [
    basicSetup,
    python(),
    lightTheme,
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !readOnly) onChange(update.state.doc.toString());
    }),
    ...(readOnly ? [EditorState.readOnly.of(true)] : []),
  ], [onChange, readOnly]);

  useEffect(() => {
    if (!containerRef.current) return;
    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: containerRef.current,
    });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  return <div ref={containerRef} style={{ height, overflow: 'auto' }} />;
}
