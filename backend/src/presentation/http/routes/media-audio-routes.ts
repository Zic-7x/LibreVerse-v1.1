import type { FastifyInstance } from "fastify";
import type { AttachAudioInput } from "@platform/shared-types";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  AttachAudioToMediaUseCase,
  RemoveAudioFromMediaUseCase,
} from "../../../application/use-cases/creative/media-audio-use-cases.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";

export interface MediaAudioRouteDeps {
  attachAudio: AttachAudioToMediaUseCase;
  removeAudio: RemoveAudioFromMediaUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

export function registerMediaAudioRoutes(
  app: FastifyInstance,
  deps: MediaAudioRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  app.post(
    "/media/:id/audio",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const body = request.body as AttachAudioInput;

      return handleUseCase(reply, async () => {
        await deps.attachAudio.execute(auth.userId, id, body);
        return { success: true };
      });
    },
  );

  app.delete(
    "/media/:id/audio",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(reply, async () => {
        await deps.removeAudio.execute(auth.userId, id);
        return { success: true };
      });
    },
  );
}
