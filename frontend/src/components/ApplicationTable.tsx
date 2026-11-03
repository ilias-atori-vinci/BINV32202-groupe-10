import type { ApplicationListItem } from "../models/application.ts";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_TONES, PERIOD_LABELS } from "../utils/labels.ts";
import StatusBadge from "./StatusBadge.tsx";

interface ApplicationTableProps {
  applications: ApplicationListItem[];
  onWithdraw?: (applicationId: number) => void;
  withdrawingId?: number | null;
}

const ApplicationTable = ({ applications, onWithdraw, withdrawingId = null }: ApplicationTableProps) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Offre</th>
          <th scope="col">Entreprise</th>
          <th scope="col">Année</th>
          <th scope="col">Période</th>
          <th scope="col">Statut</th>
          {onWithdraw && <th scope="col">Action</th>}
        </tr>
      </thead>
      <tbody>
        {applications.map((application) => (
          <tr key={application.id}>
            <td>{application.offerTitle}</td>
            <td>{application.companyShortName}</td>
            <td>{application.academicYear}</td>
            <td>{PERIOD_LABELS[application.period]}</td>
            <td>
              <StatusBadge
                label={APPLICATION_STATUS_LABELS[application.status]}
                tone={APPLICATION_STATUS_TONES[application.status]}
              />
            </td>
            {onWithdraw && (
              <td>
                {application.status === "IN_PROGRESS" && (
                <button
                  className="button"
                  type="button"
                  disabled={withdrawingId === application.id}
                  onClick={() => onWithdraw(application.id)}
                >
                  {withdrawingId === application.id ? "Retrait…" : "Retirer"}
                </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ApplicationTable;
