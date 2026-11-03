import ApplicationTable from "../components/ApplicationTable.tsx";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import { useApplications } from "../hooks/useApplications.ts";

interface ApplicationsPageProps {
  token: string;
  onUnauthorized: () => void;
}

const ApplicationsPage = ({ token, onUnauthorized }: ApplicationsPageProps) => {
  const { applications, isLoading, error } = useApplications(token, onUnauthorized);
  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (isLoading) return <LoadingState />;
    if (applications.length === 0) {
      return <EmptyState message="Vous n'avez encore aucune candidature." />;
    }
    return (
      <>
        <p className="result-count">
          {applications.length} candidature{applications.length > 1 ? "s" : ""}
        </p>
        <ApplicationTable
          applications={applications}
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
