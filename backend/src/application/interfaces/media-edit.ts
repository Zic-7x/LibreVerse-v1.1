import type {
  MediaEditEntity,
  MediaOverlayEntity,
} from "../../domain/entities/media-edit-entities.js";

export interface SaveMediaEditParams {
  filterPresetId?: string | null;
  crop?: Record<string, number> | null;
  trimStartMs?: number | null;
  trimEndMs?: number | null;
  speed?: number;
  effects?: string[];
}

export interface UpsertOverlayParams {
  overlayType: string;
  stickerAssetId?: string | null;
  content: Record<string, unknown>;
  zIndex?: number;
}

export interface AttachAudioParams {
  audioTrackId: string;
  startOffsetMs?: number;
  volume?: number;
}

export interface MediaEditRepository {
  upsertForMedia(
    mediaId: string,
    createdBy: string,
    params: SaveMediaEditParams,
  ): Promise<MediaEditEntity>;

  findByMediaId(mediaId: string): Promise<MediaEditEntity | null>;

  addOverlay(
    mediaEditId: string,
    params: UpsertOverlayParams,
  ): Promise<MediaOverlayEntity>;

  removeOverlay(overlayId: string, mediaEditId: string): Promise<void>;

  setAudio(mediaId: string, params: AttachAudioParams): Promise<void>;

  clearAudio(mediaId: string): Promise<void>;
}
