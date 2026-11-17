import { useEffect, useMemo, useState } from "react";
import type { Offer, PeriodCode } from "../models/offer.ts";
import { getOffers } from "../services/offers.service.ts";
import { isUnauthorized } from "../utils/api.ts";

/**
 * Offres visibles par l'utilisateur, choisies par le backend selon son profil.
 * onUnauthorized doit être stable (useCallback) pour ne pas relancer le chargement.
 */
export const useOffers = (
  token: string,
  period: PeriodCode | undefined,
  title: string,
  onUnauthorized: () => void,
) => {
  // Chaque changement de session, période ou titre identifie un nouveau chargement.
  const request = useMemo(() => ({ token, period, title }), [token, period, title]);
  const [result, setResult] = useState<{
    request: typeof request;
    offers: Offer[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getOffers(request.token, request.period, request.title, controller.signal)
      .then((offers) => {
        if (!controller.signal.aborted) setResult({ request, offers, error: null });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (isUnauthorized(reason)) {
          onUnauthorized();
        } else {
          setResult({
            request,
            offers: [],
            error: reason instanceof Error ? reason.message : "Erreur inconnue",
          });
        }
      });

    return () => controller.abort();
  }, [request, onUnauthorized]);

  const currentResult = result?.request === request ? result : null;
  return {
    offers: currentResult?.offers ?? [],
    isLoading: currentResult === null,
    error: currentResult?.error ?? null,
  };
};
