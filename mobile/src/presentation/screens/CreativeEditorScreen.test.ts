import { describe, expect, it, vi } from "vitest";
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
import { CreativeEditorScreen } from "./CreativeEditorScreen.js";

describe("CreativeEditorScreen", () => {
  it("delegates creative editing actions to their use cases", async () => {
    const listFiltersUseCase = { execute: vi.fn().mockResolvedValue([]) } as unknown as ListFiltersUseCase;
    const listStickersUseCase = { execute: vi.fn().mockResolvedValue([]) } as unknown as ListStickersUseCase;
    const searchAudioTracksUseCase = { execute: vi.fn().mockResolvedValue([]) } as unknown as SearchAudioTracksUseCase;
    const saveMediaEditUseCase = { execute: vi.fn().mockResolvedValue({ id: "edit-1" }) } as unknown as SaveMediaEditUseCase;
    const getMediaEditUseCase = { execute: vi.fn().mockResolvedValue({ id: "edit-1" }) } as unknown as GetMediaEditUseCase;
    const addOverlayUseCase = { execute: vi.fn().mockResolvedValue({ id: "overlay-1" }) } as unknown as AddOverlayUseCase;
    const removeOverlayUseCase = { execute: vi.fn().mockResolvedValue(undefined) } as unknown as RemoveOverlayUseCase;
    const attachAudioUseCase = { execute: vi.fn().mockResolvedValue(undefined) } as unknown as AttachAudioUseCase;
    const removeAudioUseCase = { execute: vi.fn().mockResolvedValue(undefined) } as unknown as RemoveAudioUseCase;
    const screen = new CreativeEditorScreen(
      listFiltersUseCase,
      listStickersUseCase,
      searchAudioTracksUseCase,
      saveMediaEditUseCase,
      getMediaEditUseCase,
      addOverlayUseCase,
      removeOverlayUseCase,
      attachAudioUseCase,
      removeAudioUseCase,
    );
    const token = "token-1";
    const mediaId = "media-1";

    await screen.loadFilters(token);
    await screen.loadStickers(token, "fun");
    await screen.searchAudio(token, "lofi");
    await screen.applyFilter(token, mediaId, "filter-1");
    await screen.setTrim(token, mediaId, 100, 500);
    await screen.setSpeed(token, mediaId, 1.5);
    await screen.loadEditState(token, mediaId);
    await screen.addTextOverlay(token, mediaId, "Hello", 0.1, 0.2);
    await screen.addStickerOverlay(token, mediaId, "sticker-1", 0.3, 0.4);
    await screen.removeOverlay(token, mediaId, "overlay-1");
    await screen.setMusic(token, mediaId, "track-1", 500, 0.8);
    await screen.removeMusic(token, mediaId);

    expect(listFiltersUseCase.execute).toHaveBeenCalledWith(token);
    expect(listStickersUseCase.execute).toHaveBeenCalledWith(token, "fun");
    expect(searchAudioTracksUseCase.execute).toHaveBeenCalledWith(token, "lofi");
    expect(saveMediaEditUseCase.execute).toHaveBeenNthCalledWith(1, token, mediaId, { filterPresetId: "filter-1" });
    expect(saveMediaEditUseCase.execute).toHaveBeenNthCalledWith(2, token, mediaId, { trimStartMs: 100, trimEndMs: 500 });
    expect(saveMediaEditUseCase.execute).toHaveBeenNthCalledWith(3, token, mediaId, { speed: 1.5 });
    expect(getMediaEditUseCase.execute).toHaveBeenCalledWith(token, mediaId);
    expect(addOverlayUseCase.execute).toHaveBeenNthCalledWith(1, token, mediaId, {
      overlayType: "text",
      stickerAssetId: null,
      content: { text: "Hello", positionX: 0.1, positionY: 0.2 },
      zIndex: 0,
    });
    expect(addOverlayUseCase.execute).toHaveBeenNthCalledWith(2, token, mediaId, {
      overlayType: "sticker",
      stickerAssetId: "sticker-1",
      content: { positionX: 0.3, positionY: 0.4 },
      zIndex: 0,
    });
    expect(removeOverlayUseCase.execute).toHaveBeenCalledWith(token, mediaId, "overlay-1");
    expect(attachAudioUseCase.execute).toHaveBeenCalledWith(token, mediaId, "track-1", 500, 0.8);
    expect(removeAudioUseCase.execute).toHaveBeenCalledWith(token, mediaId);
  });
});
