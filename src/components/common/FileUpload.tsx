import { FileText, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatUkuranFile } from "@/lib/formatters";

interface FileUploadProps {
  label?: string;
  hint?: string;
  multiple?: boolean;
}

interface PickedFile {
  name: string;
  sizeKb: number;
}

/**
 * Mock file upload. Berkas hanya ditampilkan secara lokal — belum ada storage.
 */
export function FileUpload({
  label = "Unggah dokumen pendukung",
  hint = "Format PDF, JPG, atau XLSX. Maksimal 10 MB per berkas.",
  multiple = true,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<PickedFile[]>([]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background-subtle px-6 py-8 text-center">
        <UploadCloud className="size-5 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => inputRef.current?.click()}
        >
          Pilih Berkas
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          className="hidden"
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? []).map((file) => ({
              name: file.name,
              sizeKb: Math.max(1, Math.round(file.size / 1024)),
            }));
            setFiles((prev) => (multiple ? [...prev, ...picked] : picked));
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex items-center gap-3 bg-card px-3 py-2.5 text-sm"
            >
              <FileText className="size-4 text-muted-foreground" aria-hidden />
              <span className="flex-1 truncate text-foreground">{file.name}</span>
              <span className="num text-xs text-muted-foreground">
                {formatUkuranFile(file.sizeKb)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
