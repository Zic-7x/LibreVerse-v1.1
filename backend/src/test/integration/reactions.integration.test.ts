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

async function truncateAllTables(connectionString: string): Promise<void> {
  const client = new pg.Client(getPgClientOptions(connectionString));
  await client.connect();
  await client.query(`
    TRUNCATE TABLE
      message_reactions,
      message_media,
      messages,
      conversation_participants,
      conversations,
      friendships,
      sessions,
      devices,
      public_aliases,
      profiles,
      users
    CASCADE;
  `);
  await client.end();
}

describe("Message Reactions Integration", () => {
  let app: Awaited<ReturnType<typeof createApp>>["app"];
  let pool: pg.Pool;

  beforeAll(async () => {
    try {
      await applyMigrations(testConfig.databaseUrl);
      const container = await createApp(testConfig);
      app = container.app;
      pool = container.pool;
      await app.ready();
    } catch (err) {
      console.warn("Skipping DB tests in reactions.integration.test.ts as DB is unavailable:", (err as Error).message);
    }
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pool) await pool.end();
  });

  beforeEach(async () => {
    if (app) {
      await truncateAllTables(testConfig.databaseUrl);
    }
  });

  async function registerUser(email: string, pass: string, name: string) {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password: pass, displayName: name },
    });
    return res.json();
  }

  it("should toggle message reactions (add and remove)", async (ctx) => {
    if (!app) {
      ctx.skip();
      return;
    }
    const u1 = await registerUser("rx1@example.com", "Password123!", "RxUser1");
    const u2 = await registerUser("rx2@example.com", "Password123!", "RxUser2");

    // Send friend request & accept
    await app.inject({
      method: "POST",
      url: "/api/v1/friendships/requests",
      headers: { authorization: `Bearer ${u1.accessToken}` },
      payload: { targetUserId: u2.user.id },
    });

    const pending = await app.inject({
      method: "GET",
      url: "/api/v1/friendships/requests/pending",
      headers: { authorization: `Bearer ${u2.accessToken}` },
    });
    const reqId = pending.json()[0].id;

    await app.inject({
      method: "POST",
      url: `/api/v1/friendships/requests/${reqId}/respond`,
      headers: { authorization: `Bearer ${u2.accessToken}` },
      payload: { action: "accept" },
    });

    // Create direct conversation
    const convRes = await app.inject({
      method: "POST",
      url: "/api/v1/conversations/direct",
      headers: { authorization: `Bearer ${u1.accessToken}` },
      payload: { targetUserId: u2.user.id },
    });
    const convId = convRes.json().conversation.id;

    // Send a message
    const msgRes = await app.inject({
      method: "POST",
      url: `/api/v1/conversations/${convId}/messages`,
      headers: { authorization: `Bearer ${u1.accessToken}` },
      payload: { body: "Hello with reactions!" },
    });
    const msgId = msgRes.json().id;

    // Toggle reaction - Add ❤️
    const addRes = await app.inject({
      method: "POST",
      url: `/api/v1/messages/${msgId}/reactions`,
      headers: { authorization: `Bearer ${u2.accessToken}` },
      payload: { emoji: "❤️" },
    });

    expect(addRes.statusCode).toBe(200);
    expect(addRes.json()).toEqual({
      action: "added",
      emoji: "❤️",
      messageId: msgId,
    });

    // Fetch conversation messages and verify reaction summary
    const listRes = await app.inject({
      method: "GET",
      url: `/api/v1/conversations/${convId}/messages`,
      headers: { authorization: `Bearer ${u2.accessToken}` },
    });

    const msgs = listRes.json();
    expect(msgs[0].reactions).toBeDefined();
    expect(msgs[0].reactions).toContainEqual({
      emoji: "❤️",
      count: 1,
      reactedByMe: true,
    });

    // Toggle reaction - Remove ❤️
    const removeRes = await app.inject({
      method: "POST",
      url: `/api/v1/messages/${msgId}/reactions`,
      headers: { authorization: `Bearer ${u2.accessToken}` },
      payload: { emoji: "❤️" },
    });

    expect(removeRes.statusCode).toBe(200);
    expect(removeRes.json()).toEqual({
      action: "removed",
      emoji: "❤️",
      messageId: msgId,
    });
  });
});
