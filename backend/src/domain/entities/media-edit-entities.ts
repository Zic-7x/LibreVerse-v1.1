import type {
  MediaEdit as SharedMediaEdit,
  MediaOverlay as SharedMediaOverlay,
} from "@platform/shared-types";

export interface MediaOverlayEntity {
  id: string;
  mediaEditId: string;
  overlayType: SharedMediaOverlay["overlayType"];
  stickerAssetId: string | null;
  content: SharedMediaOverlay["content"];
  zIndex: number;
  createdAt: Date;
}

export interface MediaEditEntity {
  id: string;
  mediaId: string;
  filterPresetId: string | null;
  crop: SharedMediaEdit["crop"];
  trimStartMs: number | null;
  trimEndMs: number | null;
  speed: number;
  effects: string[];
  overlays: MediaOverlayEntity[];
  audio: {
    audioTrackId: string;
    startOffsetMs: number;
    volume: number;
  } | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toSharedMediaOverlay(
  overlay: MediaOverlayEntity,
): SharedMediaOverlay {
  return {
    id: overlay.id,
    mediaEditId: overlay.mediaEditId,
    overlayType: overlay.overlayType,
    stickerAssetId: overlay.stickerAssetId,
    content: overlay.content,
    zIndex: overlay.zIndex,
    createdAt: overlay.createdAt.toISOString(),
  };
}

export function toSharedMediaEdit(edit: MediaEditEntity): SharedMediaEdit {
  return {
    id: edit.id,
    mediaId: edit.mediaId,
    filterPresetId: edit.filterPresetId,
    crop: edit.crop,
    trimStartMs: edit.trimStartMs,
    trimEndMs: edit.trimEndMs,
    speed: edit.speed,
    effects: edit.effects,
    overlays: edit.overlays.map(toSharedMediaOverlay),
    audio: edit.audio,
    createdBy: edit.createdBy,
    createdAt: edit.createdAt.toISOString(),
    updatedAt: edit.updatedAt.toISOString(),
  };
}
