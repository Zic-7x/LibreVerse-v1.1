import type { FastifyInstance } from "fastify";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  ListFilterPresetsUseCase,
  ListStickerAssetsUseCase,
  SearchAudioTracksUseCase,
} from "../../../application/use-cases/creative/creative-catalog-use-cases.js";
import {
  toSharedAudioTrack,
  toSharedFilterPreset,
  toSharedStickerAsset,
} from "../../../domain/entities/creative-entities.js";
import { handleUseCase } from "../auth-http.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";

export interface CreativeRouteDeps {
  listFilterPresets: ListFilterPresetsUseCase;
  listStickerAssets: ListStickerAssetsUseCase;
  searchAudioTracks: SearchAudioTracksUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

export function registerCreativeRoutes(
  app: FastifyInstance,
  deps: CreativeRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  app.get(
    "/creative/filters",
    { preHandler: authMiddleware },
    async (_request, reply) => {
      return handleUseCase(reply, async () => {
        const filters = await deps.listFilterPresets.execute();
        return { filters: filters.map(toSharedFilterPreset) };
      });
    },
  );

  app.get(
    "/creative/stickers",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const query = request.query as { category?: string };

      return handleUseCase(reply, async () => {
        const stickers = await deps.listStickerAssets.execute(query.category);
        return { stickers: stickers.map(toSharedStickerAsset) };
      });
    },
  );

  app.get(
    "/creative/audio-tracks",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const query = request.query as { q?: string; limit?: string };
      const limit = query.limit ? parseInt(query.limit, 10) : undefined;

      return handleUseCase(reply, async () => {
        const tracks = await deps.searchAudioTracks.execute(query.q, limit);
        return { tracks: tracks.map(toSharedAudioTrack) };
      });
    },
  );
}
