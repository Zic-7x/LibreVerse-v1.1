import { describe, expect, it, vi } from "vitest";
import type { CreativeRepository } from "../../domain/repositories/creative-repository.js";
import {
  AddOverlayUseCase,
  AttachAudioUseCase,
  GetMediaEditUseCase,
  ListFiltersUseCase,
  ListStickersUseCase,
  RemoveAudioUseCase,
  RemoveOverlayUseCase,
  SaveMediaEditUseCase,
  SearchAudioTracksUseCase,
} from "./creative-use-cases.js";

describe("creative use cases", () => {
  it("validates required identifiers and delegates every creative operation", async () => {
    const repo = {
      listFilters: vi.fn().mockResolvedValue([]),
      listStickers: vi.fn().mockResolvedValue([]),
      searchAudioTracks: vi.fn().mockResolvedValue([]),
      saveMediaEdit: vi.fn().mockResolvedValue({ id: "edit-1" }),
      getMediaEdit: vi.fn().mockResolvedValue({ id: "edit-1" }),
      addOverlay: vi.fn().mockResolvedValue({ id: "overlay-1" }),
      removeOverlay: vi.fn().mockResolvedValue(undefined),
      attachAudio: vi.fn().mockResolvedValue(undefined),
      removeAudio: vi.fn().mockResolvedValue(undefined),
    } as unknown as CreativeRepository;
    const token = "token-1";
    const mediaId = "media-1";
    const overlay = {
      overlayType: "text" as const,
      stickerAssetId: null,
      content: { text: "Hello" },
      zIndex: 0,
    };

    await new ListFiltersUseCase(repo).execute(token);
    await new ListStickersUseCase(repo).execute(token, "fun");
    await new SearchAudioTracksUseCase(repo).execute(token, "lofi");
    await new SaveMediaEditUseCase(repo).execute(token, mediaId, { filterPresetId: "filter-1" });
    await new GetMediaEditUseCase(repo).execute(token, mediaId);
    await new AddOverlayUseCase(repo).execute(token, mediaId, overlay);
    await new RemoveOverlayUseCase(repo).execute(token, mediaId, "overlay-1");
    await new AttachAudioUseCase(repo).execute(token, mediaId, "track-1", 500, 0.8);
    await new RemoveAudioUseCase(repo).execute(token, mediaId);

    expect(repo.listFilters).toHaveBeenCalledWith(token);
    expect(repo.listStickers).toHaveBeenCalledWith(token, "fun");
    expect(repo.searchAudioTracks).toHaveBeenCalledWith(token, "lofi");
    expect(repo.saveMediaEdit).toHaveBeenCalledWith(token, mediaId, { filterPresetId: "filter-1" });
    expect(repo.getMediaEdit).toHaveBeenCalledWith(token, mediaId);
    expect(repo.addOverlay).toHaveBeenCalledWith(token, mediaId, overlay);
    expect(repo.removeOverlay).toHaveBeenCalledWith(token, mediaId, "overlay-1");
    expect(repo.attachAudio).toHaveBeenCalledWith(token, mediaId, "track-1", 500, 0.8);
    expect(repo.removeAudio).toHaveBeenCalledWith(token, mediaId);

    await expect(new ListFiltersUseCase(repo).execute("")).rejects.toThrow("Token is required.");
    await expect(new GetMediaEditUseCase(repo).execute(token, "")).rejects.toThrow("Token and mediaId are required.");
  });
});
