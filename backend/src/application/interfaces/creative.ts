import type {
  AudioTrackEntity,
  FilterPresetEntity,
  StickerAssetEntity,
} from "../../domain/entities/creative-entities.js";

export interface CreativeCatalogRepository {
  listFilterPresets(): Promise<FilterPresetEntity[]>;

  listStickerAssets(category?: string): Promise<StickerAssetEntity[]>;

  listAudioTracks(options?: {
    query?: string;
    limit?: number;
  }): Promise<AudioTrackEntity[]>;

  findAudioTrackById(id: string): Promise<AudioTrackEntity | null>;

  findFilterPresetById(id: string): Promise<FilterPresetEntity | null>;
}
