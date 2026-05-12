import { useRef, useEffect, useMemo } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';

interface Props {
  value: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
  height?: string;
}

export function EquationEditor({ value, onChange, readOnly = false, height = '200px' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const extensions = useMemo(() => [
    basicSetup,
    python(),
    oneDark,
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !readOnly) {
        onChange(update.state.doc.toString());
      }
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

  // Sync external value changes (e.g. reset)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  return (
    <div ref={containerRef} style={{ height, overflow: 'auto' }} />
  );
}
