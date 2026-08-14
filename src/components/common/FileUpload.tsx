import {
  FileText,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { formatUkuranFile } from "@/lib/formatters";

export interface FileUploadItem {
  id?: string;
  name: string;
  sizeKb: number;
  uploadedAt?: string;
  uploadedBy?: string;
}

interface FileUploadProps {
  value: FileUploadItem[];
  onChange: (files: FileUploadItem[]) => void;
  label?: string;
  hint?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxSizeMb?: number;
}

const ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "xlsx",
];

function getFileExtension(
  fileName: string,
): string {
  return (
    fileName
      .split(".")
      .pop()
      ?.toLowerCase() ?? ""
  );
}

function createTemporaryFileId(): string {
  return `local-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

/**
 * Mock controlled file upload.
 *
 * File asli belum dikirim ke storage. Component hanya menyimpan
 * metadata file agar flow frontend dapat diuji sampai Apps Script
 * dan Google Drive diintegrasikan.
 */
export function FileUpload({
  value,
  onChange,
  label = "Unggah dokumen pendukung",
  hint = "Format PDF, JPG, atau XLSX. Maksimal 10 MB per berkas.",
  multiple = true,
  disabled = false,
  maxSizeMb = 10,
}: FileUploadProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const handleFilesSelected = (
    selectedFiles: File[],
  ) => {
    setError(null);

    const validFiles: FileUploadItem[] =
      [];

    const errors: string[] = [];

    selectedFiles.forEach(
      (file) => {
        const extension =
          getFileExtension(
            file.name,
          );

        const sizeKb =
          Math.max(
            1,
            Math.round(
              file.size / 1024,
            ),
          );

        const maxSizeKb =
          maxSizeMb * 1024;

        if (
          !ALLOWED_EXTENSIONS.includes(
            extension,
          )
        ) {
          errors.push(
            `${file.name}: format tidak didukung`,
          );

          return;
        }

        if (
          sizeKb >
          maxSizeKb
        ) {
          errors.push(
            `${file.name}: ukuran melebihi ${maxSizeMb} MB`,
          );

          return;
        }

        const duplicate =
          value.some(
            (currentFile) =>
              currentFile.name ===
                file.name &&
              currentFile.sizeKb ===
                sizeKb,
          );

        if (duplicate) {
          errors.push(
            `${file.name}: file sudah dipilih`,
          );

          return;
        }

        validFiles.push({
          id: createTemporaryFileId(),
          name: file.name,
          sizeKb,
        });
      },
    );

    if (
      errors.length > 0
    ) {
      setError(
        errors.join(". "),
      );
    }

    if (
      validFiles.length === 0
    ) {
      return;
    }

    onChange(
      multiple
        ? [
            ...value,
            ...validFiles,
          ]
        : [
            validFiles[0]!,
          ],
    );

    if (
      inputRef.current
    ) {
      inputRef.current.value =
        "";
    }
  };

  const handleRemove = (
    index: number,
  ) => {
    onChange(
      value.filter(
        (_, fileIndex) =>
          fileIndex !==
          index,
      ),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background-subtle px-6 py-8 text-center">
        <UploadCloud
          className="size-5 text-muted-foreground"
          aria-hidden
        />

        <p className="mt-2 text-sm font-medium text-foreground">
          {label}
        </p>

        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {hint}
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={disabled}
          onClick={() =>
            inputRef.current?.click()
          }
        >
          Pilih Berkas
        </Button>

        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          disabled={disabled}
          accept=".pdf,.jpg,.jpeg,.xlsx"
          className="hidden"
          onChange={(event) =>
            handleFilesSelected(
              Array.from(
                event.target
                  .files ?? [],
              ),
            )
          }
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="text-xs leading-5 text-destructive"
        >
          {error}
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {value.map(
            (file, index) => (
              <li
                key={
                  file.id ??
                  `${file.name}-${file.sizeKb}-${index}`
                }
                className="flex items-center gap-3 bg-card px-3 py-2.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background-subtle text-muted-foreground">
                  <FileText
                    className="size-4"
                    aria-hidden
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {file.name}
                  </span>

                  <span className="block text-xs text-muted-foreground">
                    {formatUkuranFile(
                      file.sizeKb,
                    )}
                  </span>
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  className="size-8 text-muted-foreground hover:text-destructive"
                  aria-label={`Hapus ${file.name}`}
                  onClick={() =>
                    handleRemove(
                      index,
                    )
                  }
                >
                  <Trash2
                    className="size-3.5"
                    aria-hidden
                  />
                </Button>
              </li>
            ),
          )}
        </ul>
      ) : null}
    </div>
  );
}