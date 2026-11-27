const DOWNLOAD_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/shared-files/download`;
const MAX_BUFFERED_BYTES = 64 * 1024 * 1024;
const TOKEN_PATTERN = /^fsps_[A-Za-z0-9_-]{43}$/;

export type SharedFile = { name: string; size: number; contentType: string };

function filename(header: string | null): string {
  const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      /* Fall back to plain filename. */
    }
  }
  return header?.match(/filename="([^"]+)"/)?.[1] ?? "download";
}

function assertToken(token: string) {
  if (!TOKEN_PATTERN.test(token)) throw new Error("Link chia sẻ không hợp lệ.");
}

function headers(token: string): HeadersInit {
  assertToken(token);
  return { Authorization: `Share ${token}` };
}

function assertResponse(response: Response) {
  if (!response.ok)
    throw new Error("Link đã hết hạn, bị thu hồi hoặc tệp không còn khả dụng.");
}

export async function inspectSharedFile(
  token: string,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<SharedFile> {
  const response = await fetcher(DOWNLOAD_URL, {
    method: "HEAD",
    headers: headers(token),
    credentials: "omit",
    cache: "no-store",
    signal,
    referrerPolicy: "no-referrer",
  });
  assertResponse(response);
  const size = Number(response.headers.get("Content-Length"));
  if (!Number.isSafeInteger(size) || size < 0)
    throw new Error("Thông tin tệp không hợp lệ.");
  return {
    name: filename(response.headers.get("Content-Disposition")),
    size,
    contentType:
      response.headers.get("Content-Type") ?? "application/octet-stream",
  };
}

type FilePickerWindow = Window & {
  showSaveFilePicker?: (options: { suggestedName: string }) => Promise<{
    createWritable(): Promise<{
      write(chunk: Uint8Array): Promise<void>;
      close(): Promise<void>;
      abort(): Promise<void>;
    }>;
  }>;
};

export async function saveSharedFile(
  token: string,
  file: SharedFile,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const picker = (window as FilePickerWindow).showSaveFilePicker;
  // Open the picker before awaiting the network request to preserve the click gesture.
  const handle = picker
    ? await picker.call(window, { suggestedName: file.name })
    : null;
  if (!handle && file.size > MAX_BUFFERED_BYTES)
    throw new Error(
      "Trình duyệt này cần hỗ trợ lưu theo luồng để tải tệp trên 64 MiB.",
    );
  const writer = handle ? await handle.createWritable() : null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  try {
    const response = await fetcher(DOWNLOAD_URL, {
      method: "GET",
      headers: headers(token),
      credentials: "omit",
      cache: "no-store",
      signal,
      referrerPolicy: "no-referrer",
    });
    assertResponse(response);
    if (!response.body) throw new Error("Máy chủ không trả luồng tệp.");
    reader = response.body.getReader();
    let received = 0;
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > file.size) throw new Error("Tệp tải về không hợp lệ.");
      if (writer) await writer.write(value);
      else chunks.push(new Uint8Array(value));
    }
    if (received !== file.size) throw new Error("Tệp tải về không đầy đủ.");
    if (writer) await writer.close();
    else {
      const url = URL.createObjectURL(
        new Blob(chunks, { type: file.contentType }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  } catch (error) {
    await reader?.cancel().catch(() => undefined);
    await writer?.abort().catch(() => undefined);
    throw error;
  }
}
