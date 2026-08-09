import { ApplicationError } from "../../errors/application-error.js";
import type { CreativeCatalogRepository } from "../../interfaces/creative.js";
import type {
  AttachAudioParams,
  MediaEditRepository,
} from "../../interfaces/media-edit.js";
import type { MediaRepository } from "../../interfaces/media.js";

export class AttachAudioToMediaUseCase {
  constructor(
    private readonly mediaRepo: MediaRepository,
    private readonly mediaEditRepo: MediaEditRepository,
    private readonly catalogRepo: CreativeCatalogRepository,
  ) {}

  async execute(
    userId: string,
    mediaId: string,
    input: AttachAudioParams,
  ): Promise<void> {
    const media = await this.mediaRepo.findById(mediaId);

    if (!media || media.status === "deleted" || media.deletedAt) {
      throw new ApplicationError("NOT_FOUND", "Media not found");
    }

    if (media.uploaderUserId !== userId) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You do not have permission to edit this media",
      );
    }

    const track = await this.catalogRepo.findAudioTrackById(input.audioTrackId);
    if (!track) {
      throw new ApplicationError("NOT_FOUND", "Audio track not found");
    }

    if (!track.isActive) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "Audio track is not available",
      );
    }

    if (
      input.startOffsetMs != null &&
      (input.startOffsetMs < 0 || input.startOffsetMs >= track.durationMs)
    ) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "startOffsetMs out of range",
      );
    }

    if (input.volume != null && (input.volume < 0 || input.volume > 2)) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "volume must be between 0 and 2",
      );
    }

    await this.mediaEditRepo.setAudio(mediaId, input);
  }
}

export class RemoveAudioFromMediaUseCase {
  constructor(
    private readonly mediaRepo: MediaRepository,
    private readonly mediaEditRepo: MediaEditRepository,
  ) {}

  async execute(userId: string, mediaId: string): Promise<void> {
    const media = await this.mediaRepo.findById(mediaId);

    if (!media || media.status === "deleted" || media.deletedAt) {
      throw new ApplicationError("NOT_FOUND", "Media not found");
    }

    if (media.uploaderUserId !== userId) {
      throw new ApplicationError(
        "FORBIDDEN",
        "You do not have permission to edit this media",
      );
    }

    await this.mediaEditRepo.clearAudio(mediaId);
  }
}
