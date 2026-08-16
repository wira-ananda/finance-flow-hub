import { FileText, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  MAX_WEB_UPLOAD_SIZE_MB,
  normalizeUploadMimeType,
  validateUploadFile,
} from "@/lib/file-upload";
import { formatUkuranFile } from "@/lib/formatters";

import type { FileUploadItem } from "@/types/files";

export type { FileUploadItem } from "@/types/files";

interface FileUploadProps {
  value: FileUploadItem[];
  onChange: (files: FileUploadItem[]) => void;
  label?: string;
  hint?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxSizeMb?: number;
}

function createTemporaryFileId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Controlled file picker untuk attachment request dan bukti pembayaran.
 * File asli disimpan di state sampai user menekan aksi submit/save.
 */
export function FileUpload({
  value,
  onChange,
  label = "Unggah dokumen pendukung",
  hint = `Format PDF, JPG, atau JPEG. Maksimal ${MAX_WEB_UPLOAD_SIZE_MB} MB per berkas.`,
  multiple = true,
  disabled = false,
  maxSizeMb = MAX_WEB_UPLOAD_SIZE_MB,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setError(null);

    const validFiles: FileUploadItem[] = [];
    const errors: string[] = [];

    selectedFiles.forEach((file) => {
      try {
        validateUploadFile(file);

        const sizeKb = Math.max(1, Math.ceil(file.size / 1024));
        const maxSizeKb = maxSizeMb * 1024;

        if (sizeKb > maxSizeKb) {
          throw new Error(`${file.name}: ukuran maksimal ${maxSizeMb} MB.`);
        }

        const duplicate = value.some(
          (currentFile) => currentFile.name === file.name && currentFile.sizeKb === sizeKb,
        );

        if (duplicate) {
          throw new Error(`${file.name}: file sudah dipilih.`);
        }

        validFiles.push({
          id: createTemporaryFileId(),
          name: file.name,
          sizeKb,
          mimeType: normalizeUploadMimeType(file),
          file,
        });
      } catch (fileError) {
        errors.push(
          fileError instanceof Error ? fileError.message : `${file.name}: file tidak valid.`,
        );
      }
    });

    if (errors.length > 0) {
      setError(errors.join(" "));
    }

    if (validFiles.length === 0) {
      return;
    }

    onChange(multiple ? [...value, ...validFiles] : [validFiles[0]!]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background-subtle px-6 py-8 text-center">
        <UploadCloud className="size-5 text-muted-foreground" aria-hidden />

        <p className="mt-2 text-sm font-medium text-foreground">{label}</p>

        <p className="mt-1 max-w-md text-xs text-muted-foreground">{hint}</p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Pilih Berkas
        </Button>

        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          disabled={disabled}
          accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
          className="hidden"
          onChange={(event) => handleFilesSelected(Array.from(event.target.files ?? []))}
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {value.map((file, index) => (
            <li key={file.id} className="flex items-center gap-3 bg-card px-3 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background-subtle text-muted-foreground">
                <FileText className="size-4" aria-hidden />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {file.name}
                </span>

                <span className="block text-xs text-muted-foreground">
                  {formatUkuranFile(file.sizeKb)}
                  {file.file ? " · Belum diunggah" : " · Tersimpan"}
                </span>
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label={`Hapus ${file.name}`}
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
