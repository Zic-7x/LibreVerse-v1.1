import type { FastifyInstance } from "fastify";
import type {
  CompleteUploadInput,
  InitUploadInput,
} from "@platform/shared-types";
import type {
  AccessTokenService,
  UserRepository,
} from "../../../application/interfaces/auth.js";
import type {
  CompleteUploadUseCase,
  DeleteMediaUseCase,
  GetMediaUseCase,
  InitUploadUseCase,
  MarkUploadFailedUseCase,
} from "../../../application/use-cases/media/media-use-cases.ts";
import { createAuthMiddleware } from "../middleware/auth-middleware.js";
import { handleUseCase, type AuthenticatedRequest } from "../auth-http.js";
import {
  getSupabasePublicUrl,
  uploadToSupabaseBucket,
} from "../../../infrastructure/services/supabase-storage.js";
import { ApplicationError } from "../../../application/errors/application-error.js";

export interface MediaRouteDeps {
  initUpload: InitUploadUseCase;
  completeUpload: CompleteUploadUseCase;
  markUploadFailed: MarkUploadFailedUseCase;
  getMedia: GetMediaUseCase;
  deleteMedia: DeleteMediaUseCase;
  accessTokens: AccessTokenService;
  users: UserRepository;
}

export function registerMediaRoutes(
  app: FastifyInstance,
  deps: MediaRouteDeps,
): void {
  const authMiddleware = createAuthMiddleware(deps.accessTokens, deps.users);

  // Unified single-step upload endpoint
  app.post(
    "/media/upload",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = (request.body as {
        dataUrl?: string;
        mimeType?: string;
        byteSize?: number;
        storageBucket?: string;
        filename?: string;
      }) ?? {};

      if (!body.dataUrl || typeof body.dataUrl !== "string") {
        throw new ApplicationError("VALIDATION_ERROR", "dataUrl is required for upload");
      }

      const parts = body.dataUrl.split(",");
      if (parts.length < 2) {
        throw new ApplicationError("VALIDATION_ERROR", "Invalid dataUrl format");
      }

      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : body.mimeType || "image/jpeg";
      const buffer = Buffer.from(parts[1], "base64");
      const byteSize = body.byteSize || buffer.length;

      const initResult = await deps.initUpload.execute(auth.userId, {
        mimeType,
        byteSize,
        storageBucket: body.storageBucket,
      });

      const publicUrl = await uploadToSupabaseBucket(
        initResult.storageBucket,
        initResult.storageKey,
        buffer,
        mimeType,
      );

      if (!publicUrl) {
        await deps.markUploadFailed.execute(auth.userId, initResult.mediaId).catch(() => {});
        throw new ApplicationError("STORAGE_UNAVAILABLE", "Failed to upload file to storage");
      }

      const completed = await deps.completeUpload.execute(
        auth.userId,
        initResult.mediaId,
        {},
      );

      return reply.status(201).send(completed);
    },
  );

  // Initialize upload & accept inline dataUrl or media buffer
  app.post(
    "/media/upload/init",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const body = (request.body as InitUploadInput & { dataUrl?: string }) ?? {};

      const initResult = await deps.initUpload.execute(auth.userId, body);
      let publicUrl: string | null = null;

      if (body.dataUrl && typeof body.dataUrl === "string" && body.dataUrl.includes(",")) {
        const parts = body.dataUrl.split(",");
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : body.mimeType || "image/jpeg";
        const buffer = Buffer.from(parts[1], "base64");

        publicUrl = await uploadToSupabaseBucket(
          initResult.storageBucket,
          initResult.storageKey,
          buffer,
          mimeType,
        );

        if (!publicUrl) {
          await deps.markUploadFailed.execute(auth.userId, initResult.mediaId).catch(() => {});
          throw new ApplicationError("STORAGE_UNAVAILABLE", "Failed to upload file to storage");
        }

        await deps.completeUpload.execute(auth.userId, initResult.mediaId, {});
      }

      return reply.status(201).send({
        ...initResult,
        publicUrl: publicUrl || `/media/${initResult.mediaId}/content`,
      });
    },
  );

  // Complete upload
  app.post(
    "/media/:id/complete",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };
      const body = (request.body as CompleteUploadInput) ?? {};

      return handleUseCase(reply, () =>
        deps.completeUpload.execute(auth.userId, id, body),
      );
    },
  );

  // Mark upload failed
  app.post(
    "/media/:id/failed",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(reply, () =>
        deps.markUploadFailed.execute(auth.userId, id),
      );
    },
  );

  // Get media metadata
  app.get("/media/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await deps.getMedia.execute(id);
    return reply.send(result);
  });

  // Soft delete media
  app.delete(
    "/media/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const auth = (request as AuthenticatedRequest).auth;
      const { id } = request.params as { id: string };

      return handleUseCase(
        reply,
        () => deps.deleteMedia.execute(auth.userId, id),
        204,
      );
    },
  );

  // Content endpoint (download/stream proxy/redirect)
  app.get("/media/:id/content", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const res = await deps.getMedia.execute(id);
      if (res.media.publicUrl) {
        return reply.redirect(res.media.publicUrl);
      }
      const publicUrl = getSupabasePublicUrl(
        res.media.storageBucket,
        res.media.storageKey,
      );
      if (publicUrl) {
        return reply.redirect(publicUrl);
      }
    } catch {
      // Fallback if ID is invalid or media not found
    }

    // SVG placeholder for broken fallback
    reply.header("content-type", "image/svg+xml");
    return reply.send(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="100%" height="100%" fill="#18181b"/><text x="50%" y="50%" fill="#f43f5e" font-size="20" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">GamiUnity Media</text></svg>`,
      ),
    );
  });
}

