import type {
  MobileAudioTrack,
  MobileFilterPreset,
  MobileMediaEdit,
  MobileMediaOverlay,
  MobileStickerAsset,
} from "../entities/creative.js";

export interface CreativeRepository {
  listFilters(token: string): Promise<MobileFilterPreset[]>;
  listStickers(
    token: string,
    category?: string,
  ): Promise<MobileStickerAsset[]>;
  searchAudioTracks(
    token: string,
    query?: string,
  ): Promise<MobileAudioTrack[]>;
  saveMediaEdit(
    token: string,
    mediaId: string,
    input: Partial<MobileMediaEdit>,
  ): Promise<MobileMediaEdit>;
  getMediaEdit(token: string, mediaId: string): Promise<MobileMediaEdit>;
  addOverlay(
    token: string,
    mediaId: string,
    overlay: Omit<MobileMediaOverlay, "id" | "mediaEditId" | "createdAt">,
  ): Promise<MobileMediaOverlay>;
  removeOverlay(token: string, mediaId: string, overlayId: string): Promise<void>;
  attachAudio(
    token: string,
    mediaId: string,
    audioTrackId: string,
    startOffsetMs?: number,
    volume?: number,
  ): Promise<void>;
  removeAudio(token: string, mediaId: string): Promise<void>;
}
