export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  let data = base64;
  if (base64.startsWith("data:")) {
    const match = base64.match(/base64,(.+)/);
    if (match) data = match[1];
  }
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function decodeBase64(content: string): Uint8Array {
  let data = content;
  if (content.startsWith("data:")) {
    const match = content.match(/base64,(.+)/);
    if (match) data = match[1];
  }
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function downloadBlob(data: Uint8Array | string, filename: string, mimeType: string) {
  const blob = typeof data === "string"
    ? new Blob([data], { type: mimeType })
    : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
