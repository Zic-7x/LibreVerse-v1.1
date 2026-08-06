import type { MobileMediaAttachment } from "../../domain/entities/media.js";
import type { MediaRepository } from "../../domain/repositories/media-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpMediaRepository implements MediaRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async uploadMedia(
    token: string,
    fileData: Blob | Buffer,
    filename: string,
    mimeType: string,
  ): Promise<MobileMediaAttachment> {
    let dataUrl: string;
    if (typeof Blob !== "undefined" && fileData instanceof Blob) {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileData);
      });
    } else {
      const b64 = Buffer.isBuffer(fileData)
        ? fileData.toString("base64")
        : Buffer.from(fileData as unknown as Uint8Array).toString("base64");
      dataUrl = `data:${mimeType};base64,${b64}`;
    }

    const res = await this.apiClient.request<{ media: MobileMediaAttachment }>("/media/upload", {
      method: "POST",
      token,
      body: JSON.stringify({
        dataUrl,
        filename,
        mimeType,
        byteSize: fileData instanceof Blob ? fileData.size : fileData.length,
      }),
    });

    return res.media;
  }

  async getMedia(token: string, mediaId: string): Promise<MobileMediaAttachment> {
    const res = await this.apiClient.request<{ media: MobileMediaAttachment }>(`/media/${mediaId}`, {
      method: "GET",
      token,
    });
    return res.media;
  }
}
