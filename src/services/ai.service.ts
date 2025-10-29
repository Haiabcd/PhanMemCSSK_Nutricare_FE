import { api } from '../config/api';

type RNAsset = { uri: string; type?: string; fileName?: string };

export async function chatAssistant(
  params: { message?: string; file?: RNAsset },
  signal?: AbortSignal
): Promise<string> {
  const form = new FormData();

  if (params.message && params.message.trim()) {
    form.append('message', params.message.trim());
  }
  if (params.file?.uri) {
    const name =
      params.file.fileName ||
      params.file.uri.split('/').pop() ||
      'photo.jpg';
    const type = params.file.type || 'image/jpeg';
    form.append('file', {
      uri: params.file.uri,
      name,
      type,
    } as any);
  }
  const res = await api.post<string>('/ai/chat', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
    transformResponse: (r) => r,
  });
  return res.data;
}
  

