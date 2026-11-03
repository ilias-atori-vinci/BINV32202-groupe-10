import { useState } from "react";
import ApplicationForm from "../components/ApplicationForm.tsx";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import OfferTable from "../components/OfferTable.tsx";
import { useOffers } from "../hooks/useOffers.ts";
import { createApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";
import { PERIOD_CODES, type PeriodCode } from "../models/offer.ts";
import type { User } from "../models/user.ts";
import { PERIOD_LABELS } from "../utils/labels.ts";

interface OffersPageProps {
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const DESCRIPTIONS = {
  ADMIN: "Toutes les offres, tous statuts confondus.",
  STUDENT: "Les offres publiées.",
  CONTACT: "Les offres que vous avez déposées.",
} as const;

const OffersPage = ({ user, token, onUnauthorized }: OffersPageProps) => {
  const [period, setPeriod] = useState<PeriodCode | undefined>();
  const [selectedOffer, setSelectedOffer] = useState<{ id: number; title: string } | null>(null);
  const [appliedOfferIds, setAppliedOfferIds] = useState<Set<number>>(() => new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [applicationSuccess, setApplicationSuccess] = useState<string | null>(null);
  const { offers, isLoading, error } = useOffers(token, period, onUnauthorized);

  const handleApply = (message: string) => {
    if (selectedOffer === null) return;
    setIsSubmitting(true);
    setApplicationError(null);
    createApplication(token, selectedOffer.id, message)
      .then(() => {
        setAppliedOfferIds((ids) => new Set(ids).add(selectedOffer.id));
        setApplicationSuccess("Votre candidature a été envoyée.");
        setSelectedOffer(null);
      })
      .catch((reason: unknown) => {
        if (isUnauthorized(reason)) {
          onUnauthorized();
        } else {
          setApplicationError(
            reason instanceof Error ? reason.message : "Envoi de la candidature impossible",
          );
        }
      })
      .finally(() => setIsSubmitting(false));
  };

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (isLoading) return <LoadingState />;
    if (offers.length === 0) return <EmptyState message="Aucune offre à afficher." />;
    return (
      <>
        <p className="result-count">
          {offers.length} offre{offers.length > 1 ? "s" : ""}
        </p>
        <OfferTable
          offers={offers}
          onApply={
            user.kind === "STUDENT"
              ? (offer) => {
                  setApplicationSuccess(null);
                  setApplicationError(null);
                  setSelectedOffer({ id: offer.id, title: offer.title });
                }
              : undefined
          }
          appliedOfferIds={appliedOfferIds}
        />
      </>
    );
  };

  return (
    <section>
      <h1>Offres de stage</h1>
      <p>{DESCRIPTIONS[user.kind]}</p>
      {applicationSuccess && <p className="state state-success">{applicationSuccess}</p>}
      {selectedOffer && (
        <ApplicationForm
          offerTitle={selectedOffer.title}
          isSubmitting={isSubmitting}
          error={applicationError}
          onCancel={() => {
            setSelectedOffer(null);
            setApplicationError(null);
          }}
          onSubmit={handleApply}
        />
      )}
      <label htmlFor="offer-period">Période</label>
      <select
        id="offer-period"
        value={period ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          setPeriod(
            value === ""
              ? undefined
              : PERIOD_CODES.find((periodCode) => periodCode === value),
          );
        }}
      >
        <option value="">Toutes les périodes</option>
        {PERIOD_CODES.map((periodCode) => (
          <option key={periodCode} value={periodCode}>
            {PERIOD_LABELS[periodCode]}
          </option>
        ))}
      </select>
      {renderContent()}
    </section>
  );
};

export default OffersPage;
