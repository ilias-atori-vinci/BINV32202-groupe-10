import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OffersPage from "../src/pages/OffersPage.tsx";
import { ApiError } from "../src/utils/api.ts";
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
  it("recherche les offres par titre en ignorant les espaces extérieurs", async () => {
    const fetchMock = stubFetch({
      "/api/offers": () => Response.json(offers),
    });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Refonte du portail client");

    fireEvent.change(screen.getByLabelText("Rechercher par titre"), {
      target: { value: "  portail client  " },
    });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/offers?title=portail+client",
        expect.objectContaining({ headers: { Authorization: "jeton" } }),
      ),
    );
  });

  it("affiche un message adapté quand aucun titre ne correspond", async () => {
    stubFetch({
      "/api/offers": () => Response.json([]),
    });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Rechercher par titre"), {
      target: { value: "titre absent" },
    });
    expect(await screen.findByText("Aucune offre ne correspond à la recherche.")).toBeInTheDocument();
  });

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
    let offersCalls = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input).includes("/applications")) return Promise.resolve(Response.json([]));
      return ++offersCalls === 1 ? Promise.resolve(Response.json(offers)) : nextResponse;
    });
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

describe("OffersPage : candidature", () => {
  const publishedOffer = {
    id: 1,
    title: "Application React de gestion de flotte",
    companyShortName: "Lumen Digital",
    academicYear: "2026-2027",
    period: "P2" as const,
    status: "PUBLISHED" as const,
  };

  it("permet à un étudiant d'envoyer une candidature avec un message", async () => {
    const fetchMock = stubFetch({
      "/api/offers": () => Response.json([publishedOffer]),
      "/api/applications": (init) => init?.method !== "POST" ? Response.json([]) :
        Response.json(
          {
            id: 7,
            offerId: 1,
            message: "Mon message",
            status: "IN_PROGRESS",
            appliedAt: "2026-11-03 10:20:00",
          },
          { status: 201 },
        ),
    });

    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText(publishedOffer.title);
    fireEvent.click(await screen.findByRole("button", { name: "Candidater" }));
    fireEvent.change(screen.getByLabelText("Message (facultatif)"), {
      target: { value: "Mon message" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma candidature" }));

    await screen.findByText("Votre candidature a été envoyée.");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/applications",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "jeton",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offerId: 1, message: "Mon message" }),
      }),
    );
    expect(screen.getByRole("button", { name: "Candidature envoyée" })).toBeDisabled();
  });

  it("permet l'envoi sans message et n'affiche pas l'action aux contacts", async () => {
    const fetchMock = stubFetch({
      "/api/offers": () => Response.json([publishedOffer]),
      "/api/applications": (init) => init?.method !== "POST" ? Response.json([]) :
        Response.json(
          {
            id: 8,
            offerId: 1,
            message: null,
            status: "IN_PROGRESS",
            appliedAt: "2026-11-03 10:20:00",
          },
          { status: 201 },
        ),
    });

    const { unmount } = render(
      <OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />,
    );
    await screen.findByText(publishedOffer.title);
    fireEvent.click(await screen.findByRole("button", { name: "Candidater" }));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma candidature" }));
    await screen.findByText("Votre candidature a été envoyée.");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/applications",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ offerId: 1, message: "" }),
      }),
    );
    unmount();

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText(publishedOffer.title);
    expect(screen.queryByRole("button", { name: "Candidater" })).not.toBeInTheDocument();
  });

  const previousApplication = (status: "IN_PROGRESS" | "SELECTED" | "REJECTED" | "WITHDRAWN") => ({
    id: 42,
    offerId: publishedOffer.id,
    offerTitle: publishedOffer.title,
    companyShortName: publishedOffer.companyShortName,
    academicYear: publishedOffer.academicYear,
    period: publishedOffer.period,
    message: null,
    status,
    appliedAt: "2026-11-03 10:20:00",
  });

  it.each(["IN_PROGRESS", "SELECTED", "REJECTED"] as const)(
    "reconnaît une candidature %s après remontage de la page",
    async (status) => {
      stubFetch({
        "/api/offers": () => Response.json([publishedOffer]),
        "/api/applications": () => Response.json([previousApplication(status)]),
      });
      const onUnauthorized = vi.fn();
      const first = render(<OffersPage user={studentUser} token="jeton" onUnauthorized={onUnauthorized} />);
      expect(await screen.findByRole("button", { name: "Candidature envoyée" })).toBeDisabled();
      first.unmount();
      render(<OffersPage user={studentUser} token="jeton" onUnauthorized={onUnauthorized} />);
      expect(await screen.findByRole("button", { name: "Candidature envoyée" })).toBeDisabled();
    },
  );

  it("permet de recandidater après un retrait", async () => {
    stubFetch({
      "/api/offers": () => Response.json([publishedOffer]),
      "/api/applications": () => Response.json([previousApplication("WITHDRAWN")]),
    });
    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);
    expect(await screen.findByRole("button", { name: "Candidater" })).toBeEnabled();
  });

  it("ne propose pas d'envoi si la lecture des candidatures échoue", async () => {
    stubFetch({
      "/api/offers": () => Response.json([publishedOffer]),
      "/api/applications": () => new Response(null, { status: 500 }),
    });
    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Chargement des candidatures impossible");
    expect(await screen.findByText(publishedOffer.title)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Candidater" })).not.toBeInTheDocument();
  });

  it("conserve le message saisi après un refus d'envoi et signale l'erreur", async () => {
    stubFetch({
      "/api/offers": () => Response.json([publishedOffer]),
      "/api/applications": (init) => init?.method === "POST"
        ? new Response(null, { status: 409 }) : Response.json([]),
    });
    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Candidater" }));
    fireEvent.change(screen.getByLabelText("Message (facultatif)"), { target: { value: "Mon message" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma candidature" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("statut 409");
    expect(screen.getByLabelText("Message (facultatif)")).toHaveValue("Mon message");
    expect(screen.getByRole("button", { name: "Envoyer ma candidature" })).toBeEnabled();
  });

  it("ignore le refus d'un ancien envoi après changement de session", async () => {
    let rejectOld: (error: Error) => void = () => { throw new Error("Envoi absent"); };
    const pending = new Promise<Response>((_resolve, reject) => { rejectOld = reject; });
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") return pending;
      return Promise.resolve(Response.json(String(input).includes("/applications") ? [] : [publishedOffer]));
    }));
    const onUnauthorized = vi.fn();
    const { rerender } = render(<OffersPage user={studentUser} token="premier" onUnauthorized={onUnauthorized} />);
    fireEvent.click(await screen.findByRole("button", { name: "Candidater" }));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma candidature" }));
    rerender(<OffersPage user={studentUser} token="second" onUnauthorized={onUnauthorized} />);
    expect(screen.queryByLabelText("Message (facultatif)")).not.toBeInTheDocument();
    await screen.findByRole("button", { name: "Candidater" });
    await act(async () => { rejectOld(new ApiError(401, "Ancienne session")); });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Votre candidature a été envoyée.")).not.toBeInTheDocument();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("ne charge pas les candidatures pour un contact", async () => {
    const fetchMock = stubFetch({ "/api/offers": () => Response.json([publishedOffer]) });
    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText(publishedOffer.title);
    expect(fetchMock).not.toHaveBeenCalledWith("/api/applications", expect.anything());
  });


  it("signale l'expiration de session lors de l'envoi", async () => {
    stubFetch({
      "/api/offers": () => Response.json([publishedOffer]),
      "/api/applications": (init) => init?.method === "POST"
        ? new Response(null, { status: 401 }) : Response.json([]),
    });
    const onUnauthorized = vi.fn();
    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={onUnauthorized} />);
    fireEvent.click(await screen.findByRole("button", { name: "Candidater" }));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma candidature" }));
    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledOnce());
  });

  it("ignore l'historique de l'ancienne session reçu en retard", async () => {
    let resolveOld: (value: Response) => void = () => { throw new Error("Lecture absente"); };
    const pending = new Promise<Response>((resolve) => { resolveOld = resolve; });
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (!String(input).includes("/applications")) return Promise.resolve(Response.json([publishedOffer]));
      const headers = init?.headers as Record<string, string>;
      return headers.Authorization === "premier" ? pending : Promise.resolve(Response.json([]));
    }));
    const onUnauthorized = vi.fn();
    const { rerender } = render(<OffersPage user={studentUser} token="premier" onUnauthorized={onUnauthorized} />);
    await screen.findByText(publishedOffer.title);
    expect(screen.queryByRole("button", { name: "Candidater" })).not.toBeInTheDocument();
    rerender(<OffersPage user={studentUser} token="second" onUnauthorized={onUnauthorized} />);
    await screen.findByRole("button", { name: "Candidater" });
    await act(async () => { resolveOld(Response.json([previousApplication("IN_PROGRESS")])); });
    expect(screen.getByRole("button", { name: "Candidater" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Candidature envoyée" })).not.toBeInTheDocument();
  });

});
