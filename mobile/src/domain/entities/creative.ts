import type {
  FilterPreset,
  MediaEdit,
  MediaOverlay,
} from "@platform/shared-types";

export interface MobileFilterPreset {
  id: string;
  name: string;
  slug: string;
  category: FilterPreset["category"];
  config: Record<string, unknown>;
  thumbnailMediaId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface MobileStickerAsset {
  id: string;
  name: string;
  category: string;
  mediaId: string;
  isActive: boolean;
  createdAt: string;
}

export interface MobileAudioTrack {
  id: string;
  title: string;
  artist: string | null;
  sourceMediaId: string;
  durationMs: number;
  waveformJson: unknown | null;
  licenseType: string;
  isActive: boolean;
  createdAt: string;
}

export interface MobileMediaEdit {
  id: string;
  mediaId: string;
  filterPresetId: string | null;
  crop: MediaEdit["crop"];
  trimStartMs: number | null;
  trimEndMs: number | null;
  speed: number;
  effects: string[];
  overlays: MobileMediaOverlay[];
  audio: MediaEdit["audio"];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MobileMediaOverlay {
  id: string;
  mediaEditId: string;
  overlayType: MediaOverlay["overlayType"];
  stickerAssetId: string | null;
  content: MediaOverlay["content"];
  zIndex: number;
  createdAt: string;
}
