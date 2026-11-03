import { useState } from "react";
import ApplicationTable from "../components/ApplicationTable.tsx";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import { useApplications } from "../hooks/useApplications.ts";
import { isUnauthorized } from "../utils/api.ts";

interface ApplicationsPageProps {
  token: string;
  onUnauthorized: () => void;
}

const ApplicationsPage = ({ token, onUnauthorized }: ApplicationsPageProps) => {
  const { applications, isLoading, error, withdrawApplication } = useApplications(token, onUnauthorized);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);

  const handleWithdraw = async (applicationId: number) => {
    setWithdrawingId(applicationId);
    setWithdrawalError(null);
    try {
      await withdrawApplication(applicationId);
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) {
        onUnauthorized();
      } else if (reason instanceof Error) {
        setWithdrawalError(reason.message);
      } else {
        setWithdrawalError("Retrait de la candidature impossible");
      }
    } finally {
      setWithdrawingId(null);
    }
  };

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (isLoading) return <LoadingState />;
    if (applications.length === 0) {
      return <EmptyState message="Vous n'avez encore aucune candidature." />;
    }
    return (
      <>
        {withdrawalError && <p className="state state-error" role="alert">{withdrawalError}</p>}
        <p className="result-count">
          {applications.length} candidature{applications.length > 1 ? "s" : ""}
        </p>
        <ApplicationTable
          applications={applications}
          onWithdraw={handleWithdraw}
          withdrawingId={withdrawingId}
        />
      </>
    );
  };

  return (
    <section>
      <h1>Mes candidatures</h1>
      <p>Consultez vos candidatures et leur statut.</p>
      {renderContent()}
    </section>
  );
};

export default ApplicationsPage;
