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
  onUnauthorized: () => void,
) => {
  // Chaque changement de session ou de période identifie un nouveau chargement,
  // même lorsqu'on revient à une période déjà consultée.
  const request = useMemo(() => ({ token, period }), [token, period]);
  const [result, setResult] = useState<{
    request: typeof request;
    offers: Offer[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getOffers(request.token, request.period, controller.signal)
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
