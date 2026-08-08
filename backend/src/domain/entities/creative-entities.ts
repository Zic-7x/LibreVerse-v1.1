import type {
  AudioTrack as SharedAudioTrack,
  FilterPreset as SharedFilterPreset,
  StickerAsset as SharedStickerAsset,
} from "@platform/shared-types";

export interface FilterPresetEntity {
  id: string;
  name: string;
  slug: string;
  category: SharedFilterPreset["category"];
  config: Record<string, unknown>;
  thumbnailMediaId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface StickerAssetEntity {
  id: string;
  name: string;
  category: string;
  mediaId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface AudioTrackEntity {
  id: string;
  title: string;
  artist: string | null;
  sourceMediaId: string;
  durationMs: number;
  waveformJson: unknown | null;
  licenseType: string;
  isActive: boolean;
  createdAt: Date;
}

export function toSharedFilterPreset(
  filterPreset: FilterPresetEntity,
): SharedFilterPreset {
  return {
    id: filterPreset.id,
    name: filterPreset.name,
    slug: filterPreset.slug,
    category: filterPreset.category,
    config: filterPreset.config,
    thumbnailMediaId: filterPreset.thumbnailMediaId,
    sortOrder: filterPreset.sortOrder,
    isActive: filterPreset.isActive,
    createdAt: filterPreset.createdAt.toISOString(),
  };
}

export function toSharedStickerAsset(
  stickerAsset: StickerAssetEntity,
): SharedStickerAsset {
  return {
    id: stickerAsset.id,
    name: stickerAsset.name,
    category: stickerAsset.category,
    mediaId: stickerAsset.mediaId,
    isActive: stickerAsset.isActive,
    createdAt: stickerAsset.createdAt.toISOString(),
  };
}

export function toSharedAudioTrack(
  audioTrack: AudioTrackEntity,
): SharedAudioTrack {
  return {
    id: audioTrack.id,
    title: audioTrack.title,
    artist: audioTrack.artist,
    sourceMediaId: audioTrack.sourceMediaId,
    durationMs: audioTrack.durationMs,
    waveformJson: audioTrack.waveformJson,
    licenseType: audioTrack.licenseType,
    isActive: audioTrack.isActive,
    createdAt: audioTrack.createdAt.toISOString(),
  };
}
