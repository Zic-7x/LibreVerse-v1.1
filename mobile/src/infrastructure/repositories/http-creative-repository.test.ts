import { describe, expect, it, vi } from "vitest";
import type {
  MobileAudioTrack,
  MobileFilterPreset,
  MobileMediaEdit,
  MobileMediaOverlay,
  MobileStickerAsset,
} from "../../domain/entities/creative.js";
import type { ApiClient } from "../api/api-client.js";
import { HttpCreativeRepository } from "./http-creative-repository.js";

describe("HttpCreativeRepository", () => {
  it("maps creative catalog and media editing operations to their HTTP routes", async () => {
    const filter = { id: "filter-1" } as MobileFilterPreset;
    const sticker = { id: "sticker-1" } as MobileStickerAsset;
    const track = { id: "track-1" } as MobileAudioTrack;
    const edit = { id: "edit-1" } as MobileMediaEdit;
    const savedOverlay = { id: "overlay-1" } as MobileMediaOverlay;
    const request = vi.fn()
      .mockResolvedValueOnce({ filters: [filter] })
      .mockResolvedValueOnce({ stickers: [sticker] })
      .mockResolvedValueOnce({ stickers: [sticker] })
      .mockResolvedValueOnce({ tracks: [track] })
      .mockResolvedValueOnce({ edit })
      .mockResolvedValueOnce({ edit })
      .mockResolvedValueOnce({ overlay: savedOverlay })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true });
    const repository = new HttpCreativeRepository({ request } as unknown as ApiClient);
    const token = "token-1";
    const overlay = {
      overlayType: "text" as const,
      stickerAssetId: null,
      content: { text: "Hello" },
      zIndex: 2,
    };

    await expect(repository.listFilters(token)).resolves.toEqual([filter]);
    await expect(repository.listStickers(token)).resolves.toEqual([sticker]);
    await expect(repository.listStickers(token, "fun & games")).resolves.toEqual([sticker]);
    await expect(repository.searchAudioTracks(token, "lofi chill")).resolves.toEqual([track]);
    await expect(repository.saveMediaEdit(token, "media-1", { filterPresetId: "filter-1" })).resolves.toEqual(edit);
    await expect(repository.getMediaEdit(token, "media-1")).resolves.toEqual(edit);
    await expect(repository.addOverlay(token, "media-1", overlay)).resolves.toEqual(savedOverlay);
    await expect(repository.removeOverlay(token, "media-1", "overlay-1")).resolves.toBeUndefined();
    await expect(repository.attachAudio(token, "media-1", "track-1", 500, 0.8)).resolves.toBeUndefined();
    await expect(repository.removeAudio(token, "media-1")).resolves.toBeUndefined();

    expect(request).toHaveBeenNthCalledWith(1, "/creative/filters", { method: "GET", token });
    expect(request).toHaveBeenNthCalledWith(2, "/creative/stickers", { method: "GET", token });
    expect(request).toHaveBeenNthCalledWith(3, "/creative/stickers?category=fun%20%26%20games", { method: "GET", token });
    expect(request).toHaveBeenNthCalledWith(4, "/creative/audio-tracks?q=lofi%20chill", { method: "GET", token });
    expect(request).toHaveBeenNthCalledWith(5, "/media/media-1/edit", {
      method: "POST",
      token,
      body: JSON.stringify({ filterPresetId: "filter-1" }),
    });
    expect(request).toHaveBeenNthCalledWith(6, "/media/media-1/edit", { method: "GET", token });
    expect(request).toHaveBeenNthCalledWith(7, "/media/media-1/overlays", {
      method: "POST",
      token,
      body: JSON.stringify(overlay),
    });
    expect(request).toHaveBeenNthCalledWith(8, "/media/media-1/overlays/overlay-1", { method: "DELETE", token });
    expect(request).toHaveBeenNthCalledWith(9, "/media/media-1/audio", {
      method: "POST",
      token,
      body: JSON.stringify({ audioTrackId: "track-1", startOffsetMs: 500, volume: 0.8 }),
    });
    expect(request).toHaveBeenNthCalledWith(10, "/media/media-1/audio", { method: "DELETE", token });
  });
});
