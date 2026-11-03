import { Router } from "express";
import { toApplicationDto } from "../mappers/application.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import { HttpError } from "../utils/httpError.ts";

const MAX_MESSAGE_LENGTH = 2000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseBody = (body: unknown): { offerId: number; message: string | null } => {
  if (!isRecord(body)) {
    throw new HttpError(400, "INVALID_BODY", "Le corps doit être un objet JSON");
  }
  const { offerId, message } = body;
  if (typeof offerId !== "number" || !Number.isInteger(offerId) || offerId <= 0) {
    throw new HttpError(400, "INVALID_BODY", "offerId doit être un entier positif");
  }
  if (message !== undefined && typeof message !== "string") {
    throw new HttpError(400, "INVALID_BODY", "message doit être une chaîne de caractères");
  }
  const normalizedMessage = message?.trim() ?? "";
  if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(
      400,
      "INVALID_BODY",
      `message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères`,
    );
  }
  return { offerId, message: normalizedMessage === "" ? null : normalizedMessage };
};

export const createApplicationsRouter = (applicationsService: ApplicationsService) => {
  const router = Router();

  router.post("/", (req, res) => {
    const { offerId, message } = parseBody(req.body);
    const application = applicationsService.createApplication(
      getCurrentUser(req),
      offerId,
      message,
    );
    res.status(201).json(toApplicationDto(application));
  });

  return router;
};
