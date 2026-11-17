import { Router } from "express";
import { toOfferDto } from "../mappers/offer.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import { PERIOD_CODES, type PeriodCode } from "../models/offer.ts";
import { authorize } from "../middlewares/authorize.ts";
import type { OffersService } from "../services/offers.service.ts";
import { canListOffers } from "../services/permissions.ts";
import { HttpError } from "../utils/httpError.ts";

const parsePeriod = (value: unknown): PeriodCode | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !PERIOD_CODES.some((code) => code === value)) {
    throw new HttpError(400, "INVALID_QUERY", "Le paramètre period doit valoir P1, P2 ou OTHER");
  }
  return value as PeriodCode;
};

const MAX_TITLE_LENGTH = 100;

const parseTitle = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_QUERY", "Le paramètre title doit apparaître une seule fois");
  }
  if (value.length > MAX_TITLE_LENGTH) {
    throw new HttpError(
      400,
      "INVALID_QUERY",
      `Le paramètre title ne peut pas dépasser ${MAX_TITLE_LENGTH} caractères`,
    );
  }

  const title = value.trim();
  return title === "" ? undefined : title;
};

export const createOffersRouter = (offersService: OffersService) => {
  const router = Router();

  router.get("/", authorize(canListOffers), (req, res) => {
    res.json(
      offersService
        .listOffers(getCurrentUser(req), parsePeriod(req.query.period), parseTitle(req.query.title))
        .map(toOfferDto),
    );
  });

  return router;
};
