export const streamToBuffer = (
  stream: NodeJS.ReadableStream
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = []; // <-- FIX: allow string | Buffer | Uint8Array

    stream.on("data", (chunk) => {
      chunks.push(
        Buffer.isBuffer(chunk)
          ? chunk // Buffer
          : Buffer.from(chunk) // string or Uint8Array
      );
    });

    stream.on("end", () => resolve(Buffer.concat(chunks)));

    stream.on("error", (err) => reject(err));
  });
};
