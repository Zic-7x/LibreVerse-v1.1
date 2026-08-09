import type {
  MobileAudioTrack,
  MobileFilterPreset,
  MobileMediaEdit,
  MobileMediaOverlay,
  MobileStickerAsset,
} from "../../domain/entities/creative.js";
import type { CreativeRepository } from "../../domain/repositories/creative-repository.js";
import type { ApiClient } from "../api/api-client.js";

export class HttpCreativeRepository implements CreativeRepository {
  constructor(private readonly apiClient: ApiClient) {}

  async listFilters(token: string): Promise<MobileFilterPreset[]> {
    const res = await this.apiClient.request<{ filters: MobileFilterPreset[] }>("/creative/filters", {
      method: "GET",
      token,
    });
    return res.filters || [];
  }

  async listStickers(token: string, category?: string): Promise<MobileStickerAsset[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    const res = await this.apiClient.request<{ stickers: MobileStickerAsset[] }>(`/creative/stickers${query}`, {
      method: "GET",
      token,
    });
    return res.stickers || [];
  }

  async searchAudioTracks(token: string, query?: string): Promise<MobileAudioTrack[]> {
    const search = query ? `?q=${encodeURIComponent(query)}` : "";
    const res = await this.apiClient.request<{ tracks: MobileAudioTrack[] }>(`/creative/audio-tracks${search}`, {
      method: "GET",
      token,
    });
    return res.tracks || [];
  }

  async saveMediaEdit(token: string, mediaId: string, input: Partial<MobileMediaEdit>): Promise<MobileMediaEdit> {
    const res = await this.apiClient.request<{ edit: MobileMediaEdit }>(`/media/${mediaId}/edit`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
    return res.edit;
  }

  async getMediaEdit(token: string, mediaId: string): Promise<MobileMediaEdit> {
    const res = await this.apiClient.request<{ edit: MobileMediaEdit }>(`/media/${mediaId}/edit`, {
      method: "GET",
      token,
    });
    return res.edit;
  }

  async addOverlay(
    token: string,
    mediaId: string,
    overlay: Omit<MobileMediaOverlay, "id" | "mediaEditId" | "createdAt">,
  ): Promise<MobileMediaOverlay> {
    const res = await this.apiClient.request<{ overlay: MobileMediaOverlay }>(`/media/${mediaId}/overlays`, {
      method: "POST",
      token,
      body: JSON.stringify(overlay),
    });
    return res.overlay;
  }

  async removeOverlay(token: string, mediaId: string, overlayId: string): Promise<void> {
    await this.apiClient.request(`/media/${mediaId}/overlays/${overlayId}`, {
      method: "DELETE",
      token,
    });
  }

  async attachAudio(
    token: string,
    mediaId: string,
    audioTrackId: string,
    startOffsetMs?: number,
    volume?: number,
  ): Promise<void> {
    await this.apiClient.request(`/media/${mediaId}/audio`, {
      method: "POST",
      token,
      body: JSON.stringify({ audioTrackId, startOffsetMs, volume }),
    });
  }

  async removeAudio(token: string, mediaId: string): Promise<void> {
    await this.apiClient.request(`/media/${mediaId}/audio`, {
      method: "DELETE",
      token,
    });
  }
}
