import type pg from "pg";
import type { CreativeCatalogRepository } from "../../application/interfaces/creative.js";
import type {
  AudioTrackEntity,
  FilterPresetEntity,
  StickerAssetEntity,
} from "../../domain/entities/creative-entities.js";

interface FilterPresetRow {
  id: string;
  name: string;
  slug: string;
  category: FilterPresetEntity["category"];
  config: Record<string, unknown>;
  thumbnail_media_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
}

interface StickerAssetRow {
  id: string;
  name: string;
  category: string;
  media_id: string;
  is_active: boolean;
  created_at: Date;
}

interface AudioTrackRow {
  id: string;
  title: string;
  artist: string | null;
  source_media_id: string;
  duration_ms: number;
  waveform_json: unknown | null;
  license_type: string;
  is_active: boolean;
  created_at: Date;
}

function mapFilterPreset(row: FilterPresetRow): FilterPresetEntity {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    config: row.config,
    thumbnailMediaId: row.thumbnail_media_id,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapStickerAsset(row: StickerAssetRow): StickerAssetEntity {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    mediaId: row.media_id,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapAudioTrack(row: AudioTrackRow): AudioTrackEntity {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    sourceMediaId: row.source_media_id,
    durationMs: row.duration_ms,
    waveformJson: row.waveform_json,
    licenseType: row.license_type,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export class PostgresCreativeRepository implements CreativeCatalogRepository {
  constructor(private readonly pool: pg.Pool) {}

  async listFilterPresets(): Promise<FilterPresetEntity[]> {
    const result = await this.pool.query<FilterPresetRow>(
      `SELECT * FROM filter_presets
       WHERE is_active = true
       ORDER BY sort_order ASC, name ASC`,
    );

    return result.rows.map(mapFilterPreset);
  }

  async listStickerAssets(category?: string): Promise<StickerAssetEntity[]> {
    const result = category
      ? await this.pool.query<StickerAssetRow>(
          `SELECT * FROM sticker_assets
           WHERE is_active = true AND category = $1
           ORDER BY name ASC`,
          [category],
        )
      : await this.pool.query<StickerAssetRow>(
          `SELECT * FROM sticker_assets
           WHERE is_active = true
           ORDER BY name ASC`,
        );

    return result.rows.map(mapStickerAsset);
  }

  async listAudioTracks(options?: {
    query?: string;
    limit?: number;
  }): Promise<AudioTrackEntity[]> {
    const limit = Math.min(options?.limit ?? 30, 100);
    const query = options?.query;
    const result = query
      ? await this.pool.query<AudioTrackRow>(
          `SELECT * FROM audio_tracks
           WHERE is_active = true AND (title ILIKE $1 OR artist ILIKE $1)
           ORDER BY title ASC
           LIMIT $2`,
          [`%${query}%`, limit],
        )
      : await this.pool.query<AudioTrackRow>(
          `SELECT * FROM audio_tracks
           WHERE is_active = true
           ORDER BY title ASC
           LIMIT $1`,
          [limit],
        );

    return result.rows.map(mapAudioTrack);
  }

  async findAudioTrackById(id: string): Promise<AudioTrackEntity | null> {
    const result = await this.pool.query<AudioTrackRow>(
      "SELECT * FROM audio_tracks WHERE id = $1",
      [id],
    );

    if (result.rows[0]) return mapAudioTrack(result.rows[0]);
    return null;
  }

  async findFilterPresetById(id: string): Promise<FilterPresetEntity | null> {
    const result = await this.pool.query<FilterPresetRow>(
      "SELECT * FROM filter_presets WHERE id = $1",
      [id],
    );

    if (result.rows[0]) return mapFilterPreset(result.rows[0]);
    return null;
  }
}
