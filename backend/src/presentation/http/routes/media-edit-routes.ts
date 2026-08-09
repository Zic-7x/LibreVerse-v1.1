import type { FastifyInstance } from "fastify";
import type {
  SaveMediaEditInput,
  UpsertOverlayInput,
} from "@platform/shared-types";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  AddOverlayUseCase,
  GetMediaEditUseCase,
  RemoveOverlayUseCase,
  SaveMediaEditUseCase,
} from "../../../application/use-cases/creative/media-edit-use-cases.js";
import {
  toSharedMediaEdit,
  toSharedMediaOverlay,
} from "../../../domain/entities/media-edit-entities.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";

export interface MediaEditRouteDeps {
  saveMediaEdit: SaveMediaEditUseCase;
  getMediaEdit: GetMediaEditUseCase;
  addOverlay: AddOverlayUseCase;
  removeOverlay: RemoveOverlayUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

export function registerMediaEditRoutes(
  app: FastifyInstance,
  deps: MediaEditRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  app.post(
    "/media/:id/edit",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const body = request.body as SaveMediaEditInput;

      return handleUseCase(reply, async () => {
        const edit = await deps.saveMediaEdit.execute(auth.userId, id, body);
        return { edit: toSharedMediaEdit(edit) };
      });
    },
  );

  app.get(
    "/media/:id/edit",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      return handleUseCase(reply, async () => {
        const edit = await deps.getMediaEdit.execute(id);
        return { edit: toSharedMediaEdit(edit) };
      });
    },
  );

  app.post(
    "/media/:id/overlays",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const body = request.body as UpsertOverlayInput;
      const input = {
        ...body,
        content: body.content as Record<string, unknown>,
      };

      return handleUseCase(
        reply,
        async () => {
          const overlay = await deps.addOverlay.execute(auth.userId, id, input);
          return { overlay: toSharedMediaOverlay(overlay) };
        },
        201,
      );
    },
  );

  app.delete(
    "/media/:id/overlays/:overlayId",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id, overlayId } = request.params as {
        id: string;
        overlayId: string;
      };

      return handleUseCase(reply, async () => {
        await deps.removeOverlay.execute(auth.userId, id, overlayId);
        return { success: true };
      });
    },
  );
}
