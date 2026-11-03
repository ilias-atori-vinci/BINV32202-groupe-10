import { useEffect, useMemo, useState } from "react";
import type { ApplicationListItem } from "../models/application.ts";
import { getApplications } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

export const useApplications = (token: string, onUnauthorized: () => void) => {
  const request = useMemo(() => ({ token }), [token]);
  const [result, setResult] = useState<{
    request: typeof request;
    applications: ApplicationListItem[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getApplications(request.token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ request, applications: data, error: null });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (isUnauthorized(reason)) {
          onUnauthorized();
        } else {
          setResult({
            request,
            applications: [],
            error: reason instanceof Error ? reason.message : "Erreur inconnue",
          });
        }
      })

    return () => controller.abort();

  }, [request, onUnauthorized]);

  const currentResult = result?.request === request ? result : null;

  return {
    applications: currentResult?.applications ?? [],
    isLoading: currentResult === null,
    error: currentResult?.error ?? null,
  };
};
