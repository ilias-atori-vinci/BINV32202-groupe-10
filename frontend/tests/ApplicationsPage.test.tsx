import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApplicationsPage from "../src/pages/ApplicationsPage.tsx";
import { stubFetch } from "./helpers/fetchMock.ts";

const applications = [
  {
    id: 1,
    offerId: 1,
    offerTitle: "Application React de gestion de flotte",
    companyShortName: "Lumen Digital",
    academicYear: "2026-2027",
    period: "P2" as const,
    message: null,
    status: "IN_PROGRESS" as const,
    appliedAt: "2026-10-02 18:10:00",
  },
  {
    id: 2,
    offerId: 3,
    offerTitle: "API REST de facturation",
    companyShortName: "Orbis",
    academicYear: "2026-2027",
    period: "P2" as const,
    message: null,
    status: "WITHDRAWN" as const,
    appliedAt: "2026-09-30 10:30:00",
  },
  {
    id: 3,
    offerId: 4,
    offerTitle: "Migration cloud",
    companyShortName: "Datavia",
    academicYear: "2026-2027",
    period: "P1" as const,
    message: null,
    status: "SELECTED" as const,
    appliedAt: "2026-09-28 10:30:00",
  },
  {
    id: 4,
    offerId: 5,
    offerTitle: "Tests end-to-end",
    companyShortName: "Brikk",
    academicYear: "2026-2027",
    period: "OTHER" as const,
    message: null,
    status: "REJECTED" as const,
    appliedAt: "2026-09-27 10:30:00",
  },
];

describe("ApplicationsPage", () => {
  it("affiche les informations de l'offre et les statuts français", async () => {
    stubFetch({ "/api/applications": () => Response.json(applications) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Application React de gestion de flotte")).toBeInTheDocument();
    expect(screen.getByText("Lumen Digital")).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
    expect(screen.getByText("Retirée")).toBeInTheDocument();
    expect(screen.getByText("Retenue")).toBeInTheDocument();
    expect(screen.getByText("Non retenue")).toBeInTheDocument();
    expect(screen.getByText("4 candidatures")).toBeInTheDocument();
  });

  it("masque les candidatures précédentes au changement de session", async () => {
    const fetchMock = stubFetch({ "/api/applications": () => Response.json([applications[1]]) });
    fetchMock.mockResolvedValueOnce(Response.json([applications[0]]));
    const onUnauthorized = vi.fn();

    const { rerender } = render(
      <ApplicationsPage token="premier" onUnauthorized={onUnauthorized} />,
    );
    expect(await screen.findByText("Application React de gestion de flotte")).toBeInTheDocument();

    rerender(<ApplicationsPage token="second" onUnauthorized={onUnauthorized} />);
    expect(screen.queryByText("Application React de gestion de flotte")).not.toBeInTheDocument();
    expect(await screen.findByText("API REST de facturation")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/applications",
      expect.objectContaining({ headers: { Authorization: "second" } }),
    );
  });

  it("affiche un état vide", async () => {
    stubFetch({ "/api/applications": () => Response.json([]) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Vous n'avez encore aucune candidature.")).toBeInTheDocument();
  });

  it("signale une session expirée", async () => {
    stubFetch({ "/api/applications": () => new Response(null, { status: 401 }) });
    const onUnauthorized = vi.fn();

    render(<ApplicationsPage token="jeton" onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it("affiche l'erreur de l'API", async () => {
    stubFetch({ "/api/applications": () => new Response(null, { status: 500 }) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("statut 500");
  });

  it("retire une candidature en cours et conserve le statut affiché", async () => {
    const fetchMock = stubFetch({
      "/api/applications/1": () =>
        Response.json({
          id: 1,
          offerId: 1,
          message: null,
          status: "WITHDRAWN",
          appliedAt: "2026-10-02 18:10:00",
        }),
      "/api/applications": () => Response.json([applications[0]]),
    });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("En cours");
    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));

    expect(await screen.findByText("Retirée")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retirer" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/applications/1",
      expect.objectContaining({
        method: "DELETE",
        headers: { Authorization: "jeton" },
      }),
    );
  });
});
