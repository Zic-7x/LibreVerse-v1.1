import type {
  MobileAudioTrack,
  MobileFilterPreset,
  MobileMediaEdit,
  MobileMediaOverlay,
  MobileStickerAsset,
} from "../../domain/entities/creative.js";
import type { CreativeRepository } from "../../domain/repositories/creative-repository.js";

export class ListFiltersUseCase {
  constructor(private readonly repo: CreativeRepository) {}

  async execute(token: string): Promise<MobileFilterPreset[]> {
    if (!token) throw new Error("Token is required.");
    return this.repo.listFilters(token);
  }
}

export class ListStickersUseCase {
  constructor(private readonly repo: CreativeRepository) {}

  async execute(token: string, category?: string): Promise<MobileStickerAsset[]> {
    if (!token) throw new Error("Token is required.");
    return this.repo.listStickers(token, category);
  }
}

export class SearchAudioTracksUseCase {
  constructor(private readonly repo: CreativeRepository) {}

  async execute(token: string, query?: string): Promise<MobileAudioTrack[]> {
    if (!token) throw new Error("Token is required.");
    return this.repo.searchAudioTracks(token, query);
  }
}

export class SaveMediaEditUseCase {
  constructor(private readonly repo: CreativeRepository) {}

  async execute(token: string, mediaId: string, input: Partial<MobileMediaEdit>): Promise<MobileMediaEdit> {
    if (!token || !mediaId) throw new Error("Token and mediaId are required.");
    return this.repo.saveMediaEdit(token, mediaId, input);
  }
}

export class GetMediaEditUseCase {
  constructor(private readonly repo: CreativeRepository) {}

  async execute(token: string, mediaId: string): Promise<MobileMediaEdit> {
    if (!token || !mediaId) throw new Error("Token and mediaId are required.");
    return this.repo.getMediaEdit(token, mediaId);
  }
}

export class AddOverlayUseCase {
  constructor(private readonly repo: CreativeRepository) {}

  async execute(
    token: string,
    mediaId: string,
    overlay: Omit<MobileMediaOverlay, "id" | "mediaEditId" | "createdAt">,
  ): Promise<MobileMediaOverlay> {
    if (!token || !mediaId) throw new Error("Token and mediaId are required.");
    return this.repo.addOverlay(token, mediaId, overlay);
  }
}

export class RemoveOverlayUseCase {
  constructor(private readonly repo: CreativeRepository) {}

  async execute(token: string, mediaId: string, overlayId: string): Promise<void> {
    if (!token || !mediaId) throw new Error("Token and mediaId are required.");
    return this.repo.removeOverlay(token, mediaId, overlayId);
  }
}

export class AttachAudioUseCase {
  constructor(private readonly repo: CreativeRepository) {}

  async execute(
    token: string,
    mediaId: string,
    audioTrackId: string,
    startOffsetMs?: number,
    volume?: number,
  ): Promise<void> {
    if (!token || !mediaId) throw new Error("Token and mediaId are required.");
    return this.repo.attachAudio(token, mediaId, audioTrackId, startOffsetMs, volume);
  }
}

export class RemoveAudioUseCase {
  constructor(private readonly repo: CreativeRepository) {}

  async execute(token: string, mediaId: string): Promise<void> {
    if (!token || !mediaId) throw new Error("Token and mediaId are required.");
    return this.repo.removeAudio(token, mediaId);
  }
}
