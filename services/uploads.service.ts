import { api } from './api';

/**
 * Upload helpers — wrap multipart/form-data autour de l'API uploads.
 * `name` doit matcher le champ accepté par multer côté API : `files` pour
 * photos (multi), `file` pour signature/avatar (single).
 */

export interface UploadedFile {
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
}

interface PhotoUploadResp {
  files: UploadedFile[];
}

/** Upload N photos en un seul appel. URI = file://… retourné par expo-camera/image-picker. */
export async function uploadPhotos(uris: string[]): Promise<UploadedFile[]> {
  if (uris.length === 0) return [];
  const form = new FormData();
  uris.forEach((uri, i) => {
    const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
    form.append('files', {
      uri,
      name: `photo-${Date.now()}-${i}.${ext}`,
      type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    } as unknown as Blob);
  });
  const { data } = await api.post<PhotoUploadResp>('/uploads/photos', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: (d) => d, // bloque axios qui sérialiserait le FormData
  });
  return data.files;
}

/** Upload signature (PNG capturé via signature-canvas). */
export async function uploadSignature(uri: string): Promise<UploadedFile> {
  const form = new FormData();
  const ext = (uri.split('.').pop() || 'png').toLowerCase();
  form.append('file', {
    uri,
    name: `sig-${Date.now()}.${ext}`,
    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  } as unknown as Blob);
  const { data } = await api.post<UploadedFile>('/uploads/signatures', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: (d) => d,
  });
  return data;
}
