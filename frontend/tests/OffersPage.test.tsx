import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OffersPage from "../src/pages/OffersPage.tsx";
import { adminUser, contactUser, stubFetch, studentUser } from "./helpers/fetchMock.ts";

const offers = [
  {
    id: 2,
    title: "Refonte du portail client",
    companyShortName: "Lumen Digital",
    academicYear: "2026-2027",
    period: "P2",
    status: "SUBMITTED",
  },
  {
    id: 5,
    title: "Tableau de bord de qualité des données",
    companyShortName: "Lumen Data",
    academicYear: "2026-2027",
    period: "OTHER",
    status: "ASSIGNED",
  },
];

describe("OffersPage", () => {
  it("affiche les offres avec leurs libellés français", async () => {
    const fetchMock = stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Refonte du portail client")).toBeInTheDocument();
    expect(screen.getByText("Soumise")).toBeInTheDocument();
    expect(screen.getByText("Attribuée")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Autre" })).toBeInTheDocument();
    expect(screen.getByText("2 offres")).toBeInTheDocument();
    expect(screen.getByText("Les offres que vous avez déposées.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/offers",
      expect.objectContaining({ headers: { Authorization: "jeton" } }),
    );
  });

  it("transmet la période sélectionnée puis retire le filtre", async () => {
    const fetchMock = stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);
    const periodSelect = screen.getByLabelText("Période");

    await screen.findByText("Refonte du portail client");
    fireEvent.change(periodSelect, { target: { value: "P1" } });
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/offers?period=P1",
        expect.objectContaining({ headers: { Authorization: "jeton" } }),
      ),
    );

    fireEvent.change(periodSelect, { target: { value: "" } });
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/offers",
        expect.objectContaining({ headers: { Authorization: "jeton" } }),
      ),
    );
    expect(periodSelect).toHaveValue("");
  });

  it("adapte la description au profil", async () => {
    stubFetch({ "/api/offers": () => Response.json([]) });

    const { unmount } = render(
      <OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />,
    );
    expect(screen.getByText("Les offres publiées.")).toBeInTheDocument();
    expect(await screen.findByText("Aucune offre à afficher.")).toBeInTheDocument();
    unmount();

    render(<OffersPage user={adminUser} token="jeton" onUnauthorized={vi.fn()} />);
    expect(screen.getByText("Toutes les offres, tous statuts confondus.")).toBeInTheDocument();
  });

  it("affiche un refus d'accès renvoyé par le backend", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 403 }) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("statut 403");
  });

  it("signale une session expirée", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 401 }) });
    const onUnauthorized = vi.fn();

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });
});


describe("OffersPage : fiabilité du filtre", () => {
  it.each([adminUser, studentUser])("affiche les réponses des quatre choix pour $kind", async (user) => {
    stubFetch({
      "/api/offers?period=P1": () => Response.json([]),
      "/api/offers?period=P2": () => Response.json([offers[0]]),
      "/api/offers?period=OTHER": () => Response.json([offers[1]]),
      "/api/offers": () => Response.json(offers),
    });
    render(<OffersPage user={user} token="jeton" onUnauthorized={vi.fn()} />);
    expect(await screen.findByText("2 offres")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: "Période" });
    expect(screen.getAllByRole("option")).toHaveLength(4);
    fireEvent.change(select, { target: { value: "P1" } });
    expect(await screen.findByText("Aucune offre à afficher.")).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "P2" } });
    expect(await screen.findByText(offers[0]!.title)).toBeInTheDocument();
    expect(screen.queryByText(offers[1]!.title)).not.toBeInTheDocument();
    fireEvent.change(select, { target: { value: "OTHER" } });
    expect(await screen.findByText(offers[1]!.title)).toBeInTheDocument();
    expect(screen.queryByText(offers[0]!.title)).not.toBeInTheDocument();
    fireEvent.change(select, { target: { value: "" } });
    expect(await screen.findByText("2 offres")).toBeInTheDocument();
  });

  it("efface une ancienne erreur quand on revient à une période et que la requête réussit", async () => {
    let attempts = 0;
    stubFetch({
      "/api/offers?period=P1": () => ++attempts === 1
        ? new Response(null, { status: 500 })
        : Response.json([{ ...offers[0], period: "P1" }]),
      "/api/offers": () => Response.json(offers),
    });
    render(<OffersPage user={adminUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("2 offres");
    const select = screen.getByRole("combobox", { name: "Période" });
    fireEvent.change(select, { target: { value: "P1" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("statut 500");
    fireEvent.change(select, { target: { value: "P2" } });
    await screen.findByText("2 offres");
    fireEvent.change(select, { target: { value: "P1" } });
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(await screen.findByText(offers[0]!.title)).toBeInTheDocument();
  });

  it("ignore une ancienne réponse reçue après un changement rapide de filtre", async () => {
    let resolveOld: (value: Response) => void = () => { throw new Error("Requête absente"); };
    const oldResponse = new Promise<Response>((resolve) => { resolveOld = resolve; });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("period=P1")) return oldResponse;
      if (url.endsWith("period=P2")) return Promise.resolve(Response.json([offers[0]]));
      return Promise.resolve(Response.json(offers));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<OffersPage user={adminUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("2 offres");
    const select = screen.getByRole("combobox", { name: "Période" });
    fireEvent.change(select, { target: { value: "P1" } });
    expect(screen.getByRole("status")).toHaveTextContent("Chargement");
    fireEvent.change(select, { target: { value: "P2" } });
    await screen.findByText(offers[0]!.title);
    await act(async () => { resolveOld(Response.json([{ ...offers[1], period: "P1" }])); });
    expect(select).toHaveValue("P2");
    expect(screen.getByText(offers[0]!.title)).toBeInTheDocument();
    expect(screen.queryByText(offers[1]!.title)).not.toBeInTheDocument();
  });

  it("masque les offres de la session précédente pendant un changement de jeton", async () => {
    let resolveNext: (value: Response) => void = () => { throw new Error("Requête absente"); };
    const nextResponse = new Promise<Response>((resolve) => { resolveNext = resolve; });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json(offers))
      .mockReturnValueOnce(nextResponse);
    vi.stubGlobal("fetch", fetchMock);
    const onUnauthorized = vi.fn();
    const { rerender } = render(<OffersPage user={adminUser} token="premier" onUnauthorized={onUnauthorized} />);
    await screen.findByText("2 offres");
    rerender(<OffersPage user={studentUser} token="second" onUnauthorized={onUnauthorized} />);
    expect(screen.getByRole("status")).toHaveTextContent("Chargement");
    expect(screen.queryByText(offers[0]!.title)).not.toBeInTheDocument();
    await act(async () => { resolveNext(Response.json([])); });
    expect(await screen.findByText("Aucune offre à afficher.")).toBeInTheDocument();
  });
});
