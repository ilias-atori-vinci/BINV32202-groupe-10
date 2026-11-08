import type { Offer } from "../models/offer.ts";
import { OFFER_STATUS_LABELS, OFFER_STATUS_TONES, PERIOD_LABELS } from "../utils/labels.ts";
import StatusBadge from "./StatusBadge.tsx";

interface OfferTableProps {
  offers: Offer[];
  onApply?: (offer: Offer) => void;
  appliedOfferIds?: ReadonlySet<number>;
}

const OfferTable = ({ offers, onApply, appliedOfferIds = new Set() }: OfferTableProps) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Titre</th>
          <th scope="col">Entreprise</th>
          <th scope="col">Année</th>
          <th scope="col">Période</th>
          <th scope="col">Statut</th>
          {onApply && offers.some((offer) => offer.status === "PUBLISHED") && (
            <th scope="col">Action</th>
          )}
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => (
          <tr key={offer.id}>
            <td>{offer.title}</td>
            <td>{offer.companyShortName}</td>
            <td>{offer.academicYear}</td>
            <td>{PERIOD_LABELS[offer.period]}</td>
            <td>
              <StatusBadge
                label={OFFER_STATUS_LABELS[offer.status]}
                tone={OFFER_STATUS_TONES[offer.status]}
              />
            </td>
            {onApply && offer.status === "PUBLISHED" && (
              <td>
                <button
                  className="button button-primary"
                  type="button"
                  disabled={appliedOfferIds.has(offer.id)}
                  onClick={() => onApply(offer)}
                >
                  {appliedOfferIds.has(offer.id) ? "Candidature envoyée" : "Candidater"}
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default OfferTable;
