import * as FileSystem from 'expo-file-system';

const DATA_URI_PATTERN = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;

function inferMimeType(uri: string): string {
  const normalized = uri.split('?')[0].toLowerCase();
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function imageUriToDataUri(uri: string): Promise<string> {
  if (!uri) throw new Error('No se recibio una imagen para procesar.');
  if (DATA_URI_PATTERN.test(uri)) return uri;

  const encoding = FileSystem.EncodingType?.Base64 ?? 'base64';
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding });
  return `data:${inferMimeType(uri)};base64,${base64}`;
}
