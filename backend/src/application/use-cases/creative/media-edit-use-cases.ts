import { ApplicationError } from "../../errors/application-error.js";
import type { CreativeCatalogRepository } from "../../interfaces/creative.js";
import type { MediaEditRepository, SaveMediaEditParams } from "../../interfaces/media-edit.js";
import type { MediaRepository } from "../../interfaces/media.js";
import type { MediaEditEntity } from "../../../domain/entities/media-edit-entities.js";

export class SaveMediaEditUseCase {
  constructor(
    private readonly mediaRepo: MediaRepository,
    private readonly mediaEditRepo: MediaEditRepository,
    private readonly filterCatalog?: CreativeCatalogRepository,
  ) {}

  async execute(
    userId: string,
    mediaId: string,
    input: SaveMediaEditParams,
  ): Promise<MediaEditEntity> {
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

    if (input.filterPresetId && this.filterCatalog) {
      const filterPreset = await this.filterCatalog.findFilterPresetById(
        input.filterPresetId,
      );
      if (!filterPreset) {
        throw new ApplicationError(
          "VALIDATION_ERROR",
          "filterPresetId does not exist",
        );
      }
    }

    if (input.trimEndMs != null && input.trimStartMs != null && input.trimEndMs <= input.trimStartMs) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "trimEndMs must be greater than trimStartMs",
      );
    }

    if (input.speed != null && (input.speed <= 0 || input.speed > 4)) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        "speed must be between 0 and 4",
      );
    }

    return this.mediaEditRepo.upsertForMedia(mediaId, userId, input);
  }
}

export class GetMediaEditUseCase {
  constructor(private readonly mediaEditRepo: MediaEditRepository) {}

  async execute(mediaId: string): Promise<MediaEditEntity> {
    const edit = await this.mediaEditRepo.findByMediaId(mediaId);
    if (!edit) {
      throw new ApplicationError("NOT_FOUND", "No edit found for this media");
    }

    return edit;
  }
}
