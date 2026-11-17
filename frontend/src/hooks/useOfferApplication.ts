import { useEffect, useMemo, useRef, useState } from "react";
import type { Offer } from "../models/offer.ts";
import { createApplication, getApplications } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

interface ApplicationState {
  appliedOfferIds: ReadonlySet<number>;
  selectedOffer: Pick<Offer, "id" | "title"> | null;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
  historyError: string | null;
}

const initialState = (): ApplicationState => ({
  appliedOfferIds: new Set(),
  selectedOffer: null,
  isSubmitting: false,
  error: null,
  success: null,
  historyError: null,
});

/** État et actions de candidature, isolés par session et indépendants du filtre des offres. */
export const useOfferApplication = (
  token: string,
  isStudent: boolean,
  onUnauthorized: () => void,
) => {
  const session = useMemo(() => ({ token, isStudent }), [token, isStudent]);
  const activeSession = useRef<typeof session | null>(null);
  const [result, setResult] = useState<{
    session: typeof session;
    state: ApplicationState;
  } | null>(null);

  useEffect(() => {
    activeSession.current = session;
    if (!session.isStudent) return () => { activeSession.current = null; };
    const controller = new AbortController();
    getApplications(session.token, controller.signal)
      .then((applications) => {
        if (controller.signal.aborted) return;
        setResult({ session, state: {
          ...initialState(),
          appliedOfferIds: new Set(applications
            .filter((application) => application.status !== "WITHDRAWN")
            .map((application) => application.offerId)),
        } });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (isUnauthorized(reason)) onUnauthorized();
        else setResult({ session, state: {
          ...initialState(),
          historyError: reason instanceof Error ? reason.message : "Chargement des candidatures impossible",
        } });
      });
    return () => {
      activeSession.current = null;
      controller.abort();
    };
  }, [session, onUnauthorized]);

  const current = result?.session === session ? result.state : null;
  const state = current ?? initialState();
  const canApply = isStudent && current !== null && current.historyError === null;

  const update = (change: (previous: ApplicationState) => ApplicationState) => {
    if (activeSession.current !== session) return;
    setResult((previous) => previous?.session === session
      ? { session, state: change(previous.state) }
      : previous);
  };

  const selectOffer = (offer: Offer) => {
    if (!canApply || state.isSubmitting || state.appliedOfferIds.has(offer.id)) return;
    update((previous) => ({ ...previous, selectedOffer: offer, error: null, success: null }));
  };

  const cancel = () => {
    if (!state.isSubmitting) update((previous) => ({ ...previous, selectedOffer: null, error: null }));
  };

  const submit = async (message: string) => {
    const offer = state.selectedOffer;
    if (!canApply || offer === null || state.isSubmitting) return;
    update((previous) => ({ ...previous, isSubmitting: true, error: null }));
    try {
      await createApplication(token, offer.id, message);
      update((previous) => ({
        ...previous,
        appliedOfferIds: new Set(previous.appliedOfferIds).add(offer.id),
        selectedOffer: null,
        success: "Votre candidature a été envoyée.",
      }));
    } catch (reason: unknown) {
      if (activeSession.current !== session) return;
      if (isUnauthorized(reason)) {
        onUnauthorized();
        return;
      }
      update((previous) => ({ ...previous,
        error: reason instanceof Error ? reason.message : "Envoi de la candidature impossible",
      }));
    } finally {
      update((previous) => ({ ...previous, isSubmitting: false }));
    }
  };

  return { ...state, canApply, isLoading: isStudent && current === null, selectOffer, cancel, submit };
};
