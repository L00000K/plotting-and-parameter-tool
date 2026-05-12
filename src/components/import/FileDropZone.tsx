import { useRef, useState } from 'react';

interface Props {
  onFile: (content: string, filename: string) => void;
  accept?: string;
}

export function FileDropZone({ onFile, accept = '.csv,.ags,.txt' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => onFile(e.target?.result as string, file.name);
    reader.readAsText(file);
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${dragging ? 'border-blue-400 bg-blue-950/30' : 'border-slate-600 hover:border-slate-400'}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) readFile(file);
      }}
    >
      <p className="text-slate-400 text-sm">
        Drop file here or <span className="text-blue-400 underline">browse</span>
      </p>
      <p className="text-slate-500 text-xs mt-1">{accept}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
      />
    </div>
  );
}
