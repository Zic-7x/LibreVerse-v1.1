import type {
  AddOverlayUseCase,
  AttachAudioUseCase,
  GetMediaEditUseCase,
  ListFiltersUseCase,
  ListStickersUseCase,
  RemoveAudioUseCase,
  RemoveOverlayUseCase,
  SaveMediaEditUseCase,
  SearchAudioTracksUseCase,
} from "../../application/use-cases/creative-use-cases.js";
import type {
  MobileAudioTrack,
  MobileFilterPreset,
  MobileMediaEdit,
  MobileMediaOverlay,
  MobileStickerAsset,
} from "../../domain/entities/creative.js";

export class CreativeEditorScreen {
  constructor(
    private readonly listFiltersUseCase: ListFiltersUseCase,
    private readonly listStickersUseCase: ListStickersUseCase,
    private readonly searchAudioTracksUseCase: SearchAudioTracksUseCase,
    private readonly saveMediaEditUseCase: SaveMediaEditUseCase,
    private readonly getMediaEditUseCase: GetMediaEditUseCase,
    private readonly addOverlayUseCase: AddOverlayUseCase,
    private readonly removeOverlayUseCase: RemoveOverlayUseCase,
    private readonly attachAudioUseCase: AttachAudioUseCase,
    private readonly removeAudioUseCase: RemoveAudioUseCase,
  ) {}

  async loadFilters(token: string): Promise<MobileFilterPreset[]> {
    return this.listFiltersUseCase.execute(token);
  }

  async loadStickers(token: string, category?: string): Promise<MobileStickerAsset[]> {
    return this.listStickersUseCase.execute(token, category);
  }

  async searchAudio(token: string, query?: string): Promise<MobileAudioTrack[]> {
    return this.searchAudioTracksUseCase.execute(token, query);
  }

  async applyFilter(token: string, mediaId: string, filterPresetId: string): Promise<MobileMediaEdit> {
    return this.saveMediaEditUseCase.execute(token, mediaId, { filterPresetId });
  }

  async setTrim(
    token: string,
    mediaId: string,
    trimStartMs: number | null,
    trimEndMs: number | null,
  ): Promise<MobileMediaEdit> {
    return this.saveMediaEditUseCase.execute(token, mediaId, { trimStartMs, trimEndMs });
  }

  async setSpeed(token: string, mediaId: string, speed: number): Promise<MobileMediaEdit> {
    return this.saveMediaEditUseCase.execute(token, mediaId, { speed });
  }

  async loadEditState(token: string, mediaId: string): Promise<MobileMediaEdit> {
    return this.getMediaEditUseCase.execute(token, mediaId);
  }

  async addTextOverlay(
    token: string,
    mediaId: string,
    text: string,
    positionX: number,
    positionY: number,
  ): Promise<MobileMediaOverlay> {
    return this.addOverlayUseCase.execute(token, mediaId, {
      overlayType: "text",
      stickerAssetId: null,
      content: { text, positionX, positionY },
      zIndex: 0,
    });
  }

  async addStickerOverlay(
    token: string,
    mediaId: string,
    stickerAssetId: string,
    positionX: number,
    positionY: number,
  ): Promise<MobileMediaOverlay> {
    return this.addOverlayUseCase.execute(token, mediaId, {
      overlayType: "sticker",
      stickerAssetId,
      content: { positionX, positionY },
      zIndex: 0,
    });
  }

  async removeOverlay(token: string, mediaId: string, overlayId: string): Promise<void> {
    return this.removeOverlayUseCase.execute(token, mediaId, overlayId);
  }

  async setMusic(
    token: string,
    mediaId: string,
    audioTrackId: string,
    startOffsetMs?: number,
    volume?: number,
  ): Promise<void> {
    return this.attachAudioUseCase.execute(token, mediaId, audioTrackId, startOffsetMs, volume);
  }

  async removeMusic(token: string, mediaId: string): Promise<void> {
    return this.removeAudioUseCase.execute(token, mediaId);
  }
}
