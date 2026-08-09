import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://platform:platform@127.0.0.1:5432/platform";

const sslConfig =
  connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false };

const filterPresets = [
  {
    name: "Classic Vivid",
    slug: "classic-vivid",
    category: "vivid",
    config: { cssFilter: "saturate(1.5) contrast(1.1)" },
  },
  {
    name: "Noir",
    slug: "noir",
    category: "bw",
    config: { cssFilter: "grayscale(1) contrast(1.2)" },
  },
  {
    name: "Golden Hour",
    slug: "golden-hour",
    category: "warm",
    config: { cssFilter: "sepia(0.3) saturate(1.3) brightness(1.05)" },
  },
  {
    name: "Cool Mist",
    slug: "cool-mist",
    category: "cool",
    config: { cssFilter: "saturate(0.85) hue-rotate(12deg) brightness(1.08)" },
  },
  {
    name: "Vintage Film",
    slug: "vintage-film",
    category: "vintage",
    config: { cssFilter: "sepia(0.2) contrast(0.9) saturate(0.8)" },
  },
  {
    name: "Soft Glow",
    slug: "soft-glow",
    category: "color",
    config: { cssFilter: "brightness(1.08) saturate(1.1) contrast(0.95)" },
  },
  {
    name: "Punch",
    slug: "punch",
    category: "vivid",
    config: { cssFilter: "contrast(1.25) saturate(1.35)" },
  },
  {
    name: "Monochrome Fade",
    slug: "monochrome-fade",
    category: "bw",
    config: { cssFilter: "grayscale(1) contrast(0.85) brightness(1.1)" },
  },
];

const stickerAssets = [
  { name: "Sparkles", category: "decorations" },
  { name: "Heart", category: "reactions" },
  { name: "Star", category: "decorations" },
  { name: "Fire", category: "reactions" },
  { name: "Smile", category: "reactions" },
  { name: "Rainbow", category: "decorations" },
];

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: sslConfig,
  });
  await client.connect();

  let filterCount = 0;
  for (const [sortOrder, filter] of filterPresets.entries()) {
    const result = await client.query(
      `INSERT INTO filter_presets (name, slug, category, config, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET config = EXCLUDED.config
       RETURNING id`,
      [
        filter.name,
        filter.slug,
        filter.category,
        JSON.stringify(filter.config),
        sortOrder,
      ],
    );
    filterCount += result.rowCount ?? 0;
  }

  const mediaResult = await client.query(
    "SELECT id FROM media ORDER BY created_at ASC LIMIT 1",
  );
  let stickerCount = 0;

  if (!mediaResult.rows[0]) {
    console.log("Skipping sticker seeding because the media table is empty.");
  } else {
    const mediaId = mediaResult.rows[0].id;
    for (const sticker of stickerAssets) {
      const result = await client.query(
        `INSERT INTO sticker_assets (name, category, media_id)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM sticker_assets
           WHERE name = $1 AND category = $2 AND media_id = $3
         )
         RETURNING id`,
        [sticker.name, sticker.category, mediaId],
      );
      stickerCount += result.rowCount ?? 0;
    }
  }

  // Audio tracks require a real uploaded audio media asset, so they are not seeded here.
  console.log(
    `Creative catalog seeded: ${filterCount} filters upserted, ${stickerCount} stickers inserted.`,
  );
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
