import { describe, expect, it, vi } from "vitest";
import type { CreativeCatalogRepository } from "../../interfaces/creative.js";
import type { MediaEditRepository } from "../../interfaces/media-edit.js";
import type { MediaRepository } from "../../interfaces/media.js";
import type { AudioTrackEntity } from "../../../domain/entities/creative-entities.js";
import type { MediaEntity } from "../../../domain/entities/media-entities.js";
import {
  AttachAudioToMediaUseCase,
  RemoveAudioFromMediaUseCase,
} from "./media-audio-use-cases.js";

function createMedia(overrides: Partial<MediaEntity> = {}): MediaEntity {
  return {
    id: "media-1",
    uploaderUserId: "user-1",
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

function createTrack(
  overrides: Partial<AudioTrackEntity> = {},
): AudioTrackEntity {
  return {
    id: "track-1",
    title: "Track",
    artist: null,
    sourceMediaId: "audio-media-1",
    durationMs: 10000,
    waveformJson: null,
    licenseType: "platform",
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  };
}

function createRepositories(media: MediaEntity | null = createMedia()) {
  const mediaRepo: Partial<MediaRepository> = {
    findById: vi.fn().mockResolvedValue(media),
  };
  const mediaEditRepo: Partial<MediaEditRepository> = {
    setAudio: vi.fn().mockResolvedValue(undefined),
    clearAudio: vi.fn().mockResolvedValue(undefined),
  };
  const catalogRepo: Partial<CreativeCatalogRepository> = {
    findAudioTrackById: vi.fn().mockResolvedValue(createTrack()),
  };

  return {
    mediaRepo: mediaRepo as MediaRepository,
    mediaEditRepo: mediaEditRepo as MediaEditRepository,
    catalogRepo: catalogRepo as CreativeCatalogRepository,
  };
}

describe("media audio use cases", () => {
  it("attaches an active track owned by the user", async () => {
    const { mediaRepo, mediaEditRepo, catalogRepo } = createRepositories();
    const useCase = new AttachAudioToMediaUseCase(
      mediaRepo,
      mediaEditRepo,
      catalogRepo,
    );
    const input = { audioTrackId: "track-1", startOffsetMs: 500, volume: 1.5 };

    await useCase.execute("user-1", "media-1", input);

    expect(mediaEditRepo.setAudio).toHaveBeenCalledWith("media-1", input);
  });

  it("rejects missing or unavailable tracks", async () => {
    const missing = createRepositories();
    vi.mocked(missing.catalogRepo.findAudioTrackById).mockResolvedValue(null);
    const missingUseCase = new AttachAudioToMediaUseCase(
      missing.mediaRepo,
      missing.mediaEditRepo,
      missing.catalogRepo,
    );

    await expect(
      missingUseCase.execute("user-1", "media-1", { audioTrackId: "missing" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", message: "Audio track not found" });

    const unavailable = createRepositories();
    vi.mocked(unavailable.catalogRepo.findAudioTrackById).mockResolvedValue(
      createTrack({ isActive: false }),
    );
    const unavailableUseCase = new AttachAudioToMediaUseCase(
      unavailable.mediaRepo,
      unavailable.mediaEditRepo,
      unavailable.catalogRepo,
    );

    await expect(
      unavailableUseCase.execute("user-1", "media-1", { audioTrackId: "track-1" }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Audio track is not available",
    });
  });

  it("validates audio offsets and volume", async () => {
    const { mediaRepo, mediaEditRepo, catalogRepo } = createRepositories();
    const useCase = new AttachAudioToMediaUseCase(
      mediaRepo,
      mediaEditRepo,
      catalogRepo,
    );

    await expect(
      useCase.execute("user-1", "media-1", {
        audioTrackId: "track-1",
        startOffsetMs: 10000,
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "startOffsetMs out of range",
    });
    await expect(
      useCase.execute("user-1", "media-1", {
        audioTrackId: "track-1",
        volume: 2.1,
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "volume must be between 0 and 2",
    });
  });

  it("uses the same authorization checks before removing audio", async () => {
    const { mediaRepo, mediaEditRepo } = createRepositories();
    const useCase = new RemoveAudioFromMediaUseCase(mediaRepo, mediaEditRepo);

    await expect(useCase.execute("other-user", "media-1")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await useCase.execute("user-1", "media-1");

    expect(mediaEditRepo.clearAudio).toHaveBeenCalledWith("media-1");
  });
});
