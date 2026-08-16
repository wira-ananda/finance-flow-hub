export interface FileUploadItem {
  id: string;
  name: string;
  sizeKb: number;
  mimeType: string;
  file?: File;
  uploadedAt?: string;
  uploadedBy?: string;
  fileUrl?: string;
}
