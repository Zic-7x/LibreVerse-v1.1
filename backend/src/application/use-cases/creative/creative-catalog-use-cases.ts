import type { CreativeCatalogRepository } from "../../interfaces/creative.js";
import type {
  AudioTrackEntity,
  FilterPresetEntity,
  StickerAssetEntity,
} from "../../../domain/entities/creative-entities.js";

export class ListFilterPresetsUseCase {
  constructor(private readonly creativeRepo: CreativeCatalogRepository) {}

  async execute(): Promise<FilterPresetEntity[]> {
    return this.creativeRepo.listFilterPresets();
  }
}

export class ListStickerAssetsUseCase {
  constructor(private readonly creativeRepo: CreativeCatalogRepository) {}

  async execute(category?: string): Promise<StickerAssetEntity[]> {
    return this.creativeRepo.listStickerAssets(category);
  }
}

export class SearchAudioTracksUseCase {
  constructor(private readonly creativeRepo: CreativeCatalogRepository) {}

  async execute(query?: string, limit?: number): Promise<AudioTrackEntity[]> {
    return this.creativeRepo.listAudioTracks({ query, limit });
  }
}
