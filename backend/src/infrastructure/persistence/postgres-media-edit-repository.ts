import type pg from "pg";
import type {
  AttachAudioParams,
  MediaEditRepository,
  SaveMediaEditParams,
  UpsertOverlayParams,
} from "../../application/interfaces/media-edit.js";
import type {
  MediaEditEntity,
  MediaOverlayEntity,
} from "../../domain/entities/media-edit-entities.js";

interface MediaEditRow {
  id: string;
  media_id: string;
  filter_preset_id: string | null;
  crop: MediaEditEntity["crop"];
  trim_start_ms: number | null;
  trim_end_ms: number | null;
  speed: string | number;
  effects: string[];
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface MediaOverlayRow {
  id: string;
  media_edit_id: string;
  overlay_type: MediaOverlayEntity["overlayType"];
  sticker_asset_id: string | null;
  content: Record<string, unknown>;
  z_index: number;
  created_at: Date;
}

interface MediaAudioTrackRow {
  audio_track_id: string;
  start_offset_ms: number;
  volume: string | number;
}

function mapMediaEdit(
  row: MediaEditRow,
  overlays: MediaOverlayEntity[] = [],
  audio: MediaEditEntity["audio"] = null,
): MediaEditEntity {
  return {
    id: row.id,
    mediaId: row.media_id,
    filterPresetId: row.filter_preset_id,
    crop: row.crop,
    trimStartMs: row.trim_start_ms,
    trimEndMs: row.trim_end_ms,
    speed: Number(row.speed),
    effects: row.effects,
    overlays,
    audio,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOverlay(row: MediaOverlayRow): MediaOverlayEntity {
  return {
    id: row.id,
    mediaEditId: row.media_edit_id,
    overlayType: row.overlay_type,
    stickerAssetId: row.sticker_asset_id,
    content: row.content,
    zIndex: row.z_index,
    createdAt: row.created_at,
  };
}

export class PostgresMediaEditRepository implements MediaEditRepository {
  constructor(private readonly pool: pg.Pool) {}

  async upsertForMedia(
    mediaId: string,
    createdBy: string,
    params: SaveMediaEditParams,
  ): Promise<MediaEditEntity> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query<MediaEditRow>(
        `INSERT INTO media_edits
           (media_id, created_by, filter_preset_id, crop, trim_start_ms, trim_end_ms, speed, effects)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (media_id) DO UPDATE SET
           filter_preset_id = COALESCE(EXCLUDED.filter_preset_id, media_edits.filter_preset_id),
           crop = COALESCE(EXCLUDED.crop, media_edits.crop),
           trim_start_ms = COALESCE(EXCLUDED.trim_start_ms, media_edits.trim_start_ms),
           trim_end_ms = COALESCE(EXCLUDED.trim_end_ms, media_edits.trim_end_ms),
           speed = COALESCE(NULLIF(EXCLUDED.speed, 0), media_edits.speed),
           effects = COALESCE(EXCLUDED.effects, media_edits.effects),
           updated_at = now()
         RETURNING *`,
        [
          mediaId,
          createdBy,
          params.filterPresetId ?? null,
          params.crop == null ? null : JSON.stringify(params.crop),
          params.trimStartMs ?? null,
          params.trimEndMs ?? null,
          params.speed ?? 0,
          JSON.stringify(params.effects ?? []),
        ],
      );

      const edit = await this.attachRelations(client, result.rows[0]!);
      await client.query("COMMIT");
      return edit;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async findByMediaId(mediaId: string): Promise<MediaEditEntity | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<MediaEditRow>(
        "SELECT * FROM media_edits WHERE media_id = $1",
        [mediaId],
      );

      if (!result.rows[0]) return null;
      return this.attachRelations(client, result.rows[0]);
    } finally {
      client.release();
    }
  }

  async addOverlay(
    mediaEditId: string,
    params: UpsertOverlayParams,
  ): Promise<MediaOverlayEntity> {
    const result = await this.pool.query<MediaOverlayRow>(
      `INSERT INTO media_overlays
         (media_edit_id, overlay_type, sticker_asset_id, content, z_index)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        mediaEditId,
        params.overlayType,
        params.stickerAssetId ?? null,
        JSON.stringify(params.content),
        params.zIndex ?? 0,
      ],
    );

    return mapOverlay(result.rows[0]!);
  }

  async removeOverlay(overlayId: string, mediaEditId: string): Promise<void> {
    await this.pool.query(
      "DELETE FROM media_overlays WHERE id = $1 AND media_edit_id = $2",
      [overlayId, mediaEditId],
    );
  }

  async setAudio(mediaId: string, params: AttachAudioParams): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM media_audio_tracks WHERE media_id = $1", [
        mediaId,
      ]);
      await client.query(
        `INSERT INTO media_audio_tracks
           (media_id, audio_track_id, start_offset_ms, volume)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (media_id, audio_track_id) DO UPDATE SET
           start_offset_ms = EXCLUDED.start_offset_ms,
           volume = EXCLUDED.volume`,
        [
          mediaId,
          params.audioTrackId,
          params.startOffsetMs ?? 0,
          params.volume ?? 1,
        ],
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async clearAudio(mediaId: string): Promise<void> {
    await this.pool.query("DELETE FROM media_audio_tracks WHERE media_id = $1", [
      mediaId,
    ]);
  }

  private async attachRelations(
    client: pg.PoolClient,
    row: MediaEditRow,
  ): Promise<MediaEditEntity> {
    const overlaysResult = await client.query<MediaOverlayRow>(
      `SELECT * FROM media_overlays
       WHERE media_edit_id = $1
       ORDER BY z_index ASC, created_at ASC`,
      [row.id],
    );
    const audioResult = await client.query<MediaAudioTrackRow>(
      `SELECT * FROM media_audio_tracks
       WHERE media_id = $1
       LIMIT 1`,
      [row.media_id],
    );
    const audio = audioResult.rows[0]
      ? {
          audioTrackId: audioResult.rows[0].audio_track_id,
          startOffsetMs: audioResult.rows[0].start_offset_ms,
          volume: Number(audioResult.rows[0].volume),
        }
      : null;

    return mapMediaEdit(row, overlaysResult.rows.map(mapOverlay), audio);
  }
}
