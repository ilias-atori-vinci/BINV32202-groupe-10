import { useState } from "react";
import ApplicationForm from "../components/ApplicationForm.tsx";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import OfferTable from "../components/OfferTable.tsx";
import SearchField from "../components/SearchField.tsx";
import { useOffers } from "../hooks/useOffers.ts";
import { useOfferApplication } from "../hooks/useOfferApplication.ts";
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
  const [title, setTitle] = useState("");
  const application = useOfferApplication(token, user.kind === "STUDENT", onUnauthorized);
  const { offers, isLoading, error } = useOffers(token, period, title, onUnauthorized);

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (isLoading) return <LoadingState />;
    if (offers.length === 0) {
      return (
        <EmptyState
          message={title.trim() === "" ? "Aucune offre à afficher." : "Aucune offre ne correspond à la recherche."}
        />
      );
    }
    return (
      <>
        <p className="result-count">
          {offers.length} offre{offers.length > 1 ? "s" : ""}
        </p>
        <OfferTable
          offers={offers}
          onApply={application.canApply ? application.selectOffer : undefined}
          appliedOfferIds={application.appliedOfferIds}
        />
      </>
    );
  };

  return (
    <section>
      <h1>Offres de stage</h1>
      <p>{DESCRIPTIONS[user.kind]}</p>
      <SearchField label="Rechercher par titre" value={title} onChange={setTitle} />
      {application.isLoading && <p aria-live="polite">Vérification des candidatures…</p>}
      {application.historyError && <ErrorState message={application.historyError} />}
      {application.success && <p className="state state-success">{application.success}</p>}
      {application.selectedOffer && (
        <ApplicationForm
          offerTitle={application.selectedOffer.title}
          isSubmitting={application.isSubmitting}
          error={application.error}
          onCancel={application.cancel}
          onSubmit={application.submit}
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
