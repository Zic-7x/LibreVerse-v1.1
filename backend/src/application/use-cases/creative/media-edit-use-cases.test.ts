import { describe, expect, it, vi } from "vitest";
import type { MediaEditRepository } from "../../interfaces/media-edit.js";
import type { MediaRepository } from "../../interfaces/media.js";
import type {
  MediaEditEntity,
  MediaOverlayEntity,
} from "../../../domain/entities/media-edit-entities.js";
import type { MediaEntity } from "../../../domain/entities/media-entities.js";
import {
  AddOverlayUseCase,
  RemoveOverlayUseCase,
  SaveMediaEditUseCase,
} from "./media-edit-use-cases.js";

function createMedia(overrides: Partial<MediaEntity> = {}): MediaEntity {
  return {
    id: "media-1",
    uploaderUserId: "owner-1",
    storageBucket: "media",
    storageKey: "media-1.mp4",
    mimeType: "video/mp4",
    byteSize: 1000,
    widthPx: null,
    heightPx: null,
    durationMs: null,
    checksumSha256: null,
    status: "ready",
    createdAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function createEdit(overrides: Partial<MediaEditEntity> = {}): MediaEditEntity {
  return {
    id: "edit-1",
    mediaId: "media-1",
    filterPresetId: null,
    crop: null,
    trimStartMs: null,
    trimEndMs: null,
    speed: 1,
    effects: [],
    overlays: [],
    audio: null,
    createdBy: "owner-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createOverlay(
  overrides: Partial<MediaOverlayEntity> = {},
): MediaOverlayEntity {
  return {
    id: "overlay-1",
    mediaEditId: "edit-1",
    overlayType: "sticker",
    stickerAssetId: "sticker-1",
    content: {},
    zIndex: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("media edit use cases", () => {
  it("throws NOT_FOUND when saving an edit for missing media", async () => {
    const mediaRepo: Partial<MediaRepository> = {
      findById: vi.fn().mockResolvedValue(null),
    };
    const mediaEditRepo: Partial<MediaEditRepository> = {
      upsertForMedia: vi.fn(),
    };
    const useCase = new SaveMediaEditUseCase(
      mediaRepo as MediaRepository,
      mediaEditRepo as MediaEditRepository,
    );

    await expect(useCase.execute("owner-1", "media-1", {})).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws FORBIDDEN when saving an edit as a non-owner", async () => {
    const mediaRepo: Partial<MediaRepository> = {
      findById: vi.fn().mockResolvedValue(createMedia()),
    };
    const mediaEditRepo: Partial<MediaEditRepository> = {
      upsertForMedia: vi.fn(),
    };
    const useCase = new SaveMediaEditUseCase(
      mediaRepo as MediaRepository,
      mediaEditRepo as MediaEditRepository,
    );

    await expect(useCase.execute("other-user", "media-1", {})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("throws VALIDATION_ERROR when trim end is not after trim start", async () => {
    const mediaRepo: Partial<MediaRepository> = {
      findById: vi.fn().mockResolvedValue(createMedia()),
    };
    const mediaEditRepo: Partial<MediaEditRepository> = {
      upsertForMedia: vi.fn(),
    };
    const useCase = new SaveMediaEditUseCase(
      mediaRepo as MediaRepository,
      mediaEditRepo as MediaEditRepository,
    );

    await expect(
      useCase.execute("owner-1", "media-1", {
        trimStartMs: 1000,
        trimEndMs: 1000,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("saves a valid edit and returns the repository result", async () => {
    const savedEdit = createEdit({ trimStartMs: 1000, trimEndMs: 5000 });
    const mediaRepo: Partial<MediaRepository> = {
      findById: vi.fn().mockResolvedValue(createMedia()),
    };
    const mediaEditRepo: Partial<MediaEditRepository> = {
      upsertForMedia: vi.fn().mockResolvedValue(savedEdit),
    };
    const useCase = new SaveMediaEditUseCase(
      mediaRepo as MediaRepository,
      mediaEditRepo as MediaEditRepository,
    );
    const input = { trimStartMs: 1000, trimEndMs: 5000 };

    await expect(useCase.execute("owner-1", "media-1", input)).resolves.toBe(
      savedEdit,
    );
    expect(mediaEditRepo.upsertForMedia).toHaveBeenCalledWith(
      "media-1",
      "owner-1",
      input,
    );
  });

  it("throws VALIDATION_ERROR for a text overlay without content.text", async () => {
    const mediaRepo: Partial<MediaRepository> = {
      findById: vi.fn().mockResolvedValue(createMedia()),
    };
    const mediaEditRepo: Partial<MediaEditRepository> = {
      findByMediaId: vi.fn().mockResolvedValue(createEdit()),
      addOverlay: vi.fn(),
    };
    const useCase = new AddOverlayUseCase(
      mediaRepo as MediaRepository,
      mediaEditRepo as MediaEditRepository,
    );

    await expect(
      useCase.execute("owner-1", "media-1", {
        overlayType: "text",
        content: {},
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("adds a valid sticker overlay", async () => {
    const overlay = createOverlay();
    const mediaRepo: Partial<MediaRepository> = {
      findById: vi.fn().mockResolvedValue(createMedia()),
    };
    const mediaEditRepo: Partial<MediaEditRepository> = {
      findByMediaId: vi.fn().mockResolvedValue(createEdit()),
      addOverlay: vi.fn().mockResolvedValue(overlay),
    };
    const useCase = new AddOverlayUseCase(
      mediaRepo as MediaRepository,
      mediaEditRepo as MediaEditRepository,
    );
    const input = {
      overlayType: "sticker",
      stickerAssetId: "sticker-1",
      content: {},
    };

    await expect(useCase.execute("owner-1", "media-1", input)).resolves.toBe(
      overlay,
    );
    expect(mediaEditRepo.addOverlay).toHaveBeenCalledWith("edit-1", input);
  });

  it("throws NOT_FOUND when removing an overlay without an edit", async () => {
    const mediaRepo: Partial<MediaRepository> = {
      findById: vi.fn().mockResolvedValue(createMedia()),
    };
    const mediaEditRepo: Partial<MediaEditRepository> = {
      findByMediaId: vi.fn().mockResolvedValue(null),
      removeOverlay: vi.fn(),
    };
    const useCase = new RemoveOverlayUseCase(
      mediaRepo as MediaRepository,
      mediaEditRepo as MediaEditRepository,
    );

    await expect(
      useCase.execute("owner-1", "media-1", "overlay-1"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
