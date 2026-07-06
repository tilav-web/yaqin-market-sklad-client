import { api } from './api';

/** Plain-text preview of TipTap HTML — used for push notification bodies and previews. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Uploads an image (notification/template picture) and returns its server-relative URL. */
export async function uploadImageFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<{ url: string }>('/uploads/image', form);
  return res.data.url;
}
