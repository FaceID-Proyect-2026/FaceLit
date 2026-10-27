import { imageUriToDataUri } from '@/shared/utils/imageToBase64';
import { readAsStringAsync } from 'expo-file-system/legacy';

jest.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64' }, readAsStringAsync: jest.fn().mockResolvedValue('YWJj'),
}));

test('web data URIs are preserved without attempting native file access', async () => {
  const uri = 'data:image/jpeg;base64,YWJj';
  expect(await imageUriToDataUri(uri)).toBe(uri);
  expect(readAsStringAsync).not.toHaveBeenCalled();
});

test.each([['jpg', 'jpeg'], ['png', 'png'], ['webp', 'webp']])('native %s captures use the supported file-reading API', async (extension, mime) => {
  const uri = `file:///camera/capture.${extension}`;
  expect(await imageUriToDataUri(uri)).toBe(`data:image/${mime};base64,YWJj`);
  expect(readAsStringAsync).toHaveBeenCalledWith(uri, { encoding: 'base64' });
});

test('an empty capture is rejected before file access', async () => {
  await expect(imageUriToDataUri('')).rejects.toThrow('No se recibio una imagen');
  expect(readAsStringAsync).not.toHaveBeenCalled();
});
