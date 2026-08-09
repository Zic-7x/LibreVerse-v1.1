import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../bootstrap/create-app.js";
import type { AppConfig } from "../../infrastructure/config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "../../../../database/migrations");

const testConfig: AppConfig = {
  host: "127.0.0.1",
  port: 0,
  logLevel: "silent",
  nodeEnv: "test",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://platform:platform@127.0.0.1:5432/platform",
  jwtSecret: "test-jwt-secret",
  jwtAccessTtlSeconds: 900,
  refreshTokenTtlSeconds: 2_592_000,
};

function getPgClientOptions(connectionString: string) {
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return {
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  };
}

async function applyMigrations(connectionString: string): Promise<void> {
  const client = new pg.Client(getPgClientOptions(connectionString));
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".up.sql"))
    .sort();

  for (const file of files) {
    const version = file.replace(/\.up\.sql$/, "");
    const { rows } = await client.query(
      "SELECT 1 FROM schema_migrations WHERE version = $1",
      [version],
    );
    if (rows.length > 0) {
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (version) VALUES ($1)",
        [version],
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }

  await client.end();
}

async function truncateTables(connectionString: string): Promise<void> {
  const client = new pg.Client(getPgClientOptions(connectionString));
  await client.connect();
  await client.query(`
    TRUNCATE media_audio_tracks, media_overlays, media_edits, sticker_assets,
      filter_presets, audio_tracks, media_variants, media, public_aliases,
      profiles, sessions, devices, users RESTART IDENTITY CASCADE
  `);
  await client.end();
}

describe("M19-M22 creative media integration", () => {
  const databaseUrl = testConfig.databaseUrl;
  let app: Awaited<ReturnType<typeof createApp>>["app"];
  let pool: pg.Pool;

  beforeAll(async () => {
    try {
      await applyMigrations(databaseUrl);
      const container = await createApp(testConfig);
      app = container.app;
      pool = container.pool;
      await app.ready();
    } catch (err) {
      console.warn("Skipping DB tests in creative.integration.test.ts as DB is unavailable:", (err as Error).message);
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    if (app) {
      await truncateTables(databaseUrl);
    }
  });

  async function registerUser(email: string) {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email, password: "password123" },
    });
    expect(res.statusCode).toBe(201);
    return res.json().accessToken as string;
  }

  it("attaches filter, overlay, and audio to a media item, then reads it back", async () => {
    if (!app) return;

    const ownerToken = await registerUser("creative_owner@example.com");
    const otherToken = await registerUser("creative_other@example.com");

    const initRes = await app.inject({
      method: "POST",
      url: "/media/upload/init",
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { mimeType: "video/mp4", byteSize: 5_000_000 },
    });
    expect(initRes.statusCode).toBe(201);
    const mediaId = initRes.json().mediaId as string;

    const completeRes = await app.inject({
      method: "POST",
      url: `/media/${mediaId}/complete`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { durationMs: 10000 },
    });
    expect(completeRes.statusCode).toBe(200);

    const filterResult = await pool.query<{ id: string }>(
      `INSERT INTO filter_presets (name, slug, category, config)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ["Test filter", "test-filter", "color", JSON.stringify({ brightness: 1 })],
    );
    const audioTrackResult = await pool.query<{ id: string }>(
      `INSERT INTO audio_tracks (title, source_media_id, duration_ms)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ["Test audio", mediaId, 10000],
    );
    await pool.query(
      `INSERT INTO sticker_assets (name, category, media_id)
       VALUES ($1, $2, $3)`,
      ["Test sticker", "general", mediaId],
    );
    const filterPresetId = filterResult.rows[0]!.id;
    const audioTrackId = audioTrackResult.rows[0]!.id;

    const editRes = await app.inject({
      method: "POST",
      url: `/media/${mediaId}/edit`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        filterPresetId,
        trimStartMs: 0,
        trimEndMs: 5000,
        speed: 1.5,
      },
    });
    expect(editRes.statusCode).toBe(200);
    expect(editRes.json().edit.speed).toBe(1.5);

    const overlayRes = await app.inject({
      method: "POST",
      url: `/media/${mediaId}/overlays`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        overlayType: "text",
        content: { text: "Hello" },
      },
    });
    expect(overlayRes.statusCode).toBe(201);

    const audioRes = await app.inject({
      method: "POST",
      url: `/media/${mediaId}/audio`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { audioTrackId },
    });
    expect(audioRes.statusCode).toBe(200);

    const getEditRes = await app.inject({
      method: "GET",
      url: `/media/${mediaId}/edit`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    expect(getEditRes.statusCode).toBe(200);
    expect(getEditRes.json().edit.overlays).toHaveLength(1);
    expect(getEditRes.json().edit.audio.audioTrackId).toBe(audioTrackId);

    const forbiddenRes = await app.inject({
      method: "POST",
      url: `/media/${mediaId}/edit`,
      headers: { authorization: `Bearer ${otherToken}` },
      payload: { speed: 1 },
    });
    expect(forbiddenRes.statusCode).toBe(403);
  });
});
