import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ADMINISTRATOR, CONTACT, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import type { UserKind } from "../src/models/user.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";
import { createTestDatabase } from "./helpers/testDatabase.ts";

let app: ReturnType<typeof createTestApp>;
let database: ReturnType<typeof createTestDatabase>;

beforeEach(() => {
  database = createTestDatabase();
  app = createTestApp(database);
});

afterEach(() => {
  database.close();
});

const listOffersAs = (kind: UserKind, id: number) =>
  request(app).get("/offers").set("Authorization", tokenFor(kind, id));

const listOffersAsPeriod = (kind: UserKind, id: number, period: string) =>
  request(app).get(`/offers?period=${period}`).set("Authorization", tokenFor(kind, id));

const listOffersAsTitle = (kind: UserKind, id: number, title: string) =>
  request(app).get("/offers").query({ title }).set("Authorization", tokenFor(kind, id));

const offerIds = (body: { id: number }[]): number[] => body.map((offer) => offer.id);

describe("GET /offers : accès", () => {
  it("refuse une requête sans session (401)", async () => {
    const response = await request(app).get("/offers");

    expect(response.status).toBe(401);
  });

  it.each([
    ["promoteur et signataire", CONTACT.NADIA_CHERIF],
    ["signataire uniquement", CONTACT.NATHALIE_RENARD],
    ["promoteur uniquement", CONTACT.LAURA_SIMON],
  ])("refuse un contact %s (403)", async (_profile, id) => {
    const response = await listOffersAs("CONTACT", id);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});

describe("GET /offers : visibilité selon le profil", () => {
  it("montre toutes les offres à un administrateur, de la plus récente année à la plus ancienne", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10);
    expect(response.body.at(-1)).toEqual({
      id: OFFER.PDF_REPORTS,
      title: "Module de rapports PDF",
      companyShortName: "Orbis",
      academicYear: "2025-2026",
      period: "P1",
      status: "ARCHIVED",
    });
  });

  it("ne montre que les offres publiées à un étudiant", async () => {
    const response = await listOffersAs("STUDENT", STUDENT.LUCAS_DUPONT);

    expect(offerIds(response.body)).toEqual([
      OFFER.INTERNAL_CHATBOT,
      OFFER.DATA_QUALITY,
      OFFER.FLEET_APP,
      OFFER.BILLING_API,
    ]);
    expect(response.body.every((o: { status: string }) => o.status === "PUBLISHED")).toBe(true);
  });

  it("montre à un déposant toutes ses offres, quel que soit leur statut", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.MARC_LEJEUNE);

    expect(offerIds(response.body)).toEqual([
      OFFER.E2E_TESTS,
      OFFER.BILLING_API,
      OFFER.PDF_REPORTS,
    ]);
  });

  it("ne montre pas à un déposant l'offre d'un collègue de la même entreprise", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.CLAIRE_DUMONT);

    expect(offerIds(response.body)).toEqual([OFFER.FLEET_APP]);
    expect(offerIds(response.body)).not.toContain(OFFER.CLIENT_PORTAL);
  });

  it("montre à un contact multi-entreprises ses offres dans ses deux entreprises", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.JULIEN_LAMBERT);

    expect(response.body.map((o: { companyShortName: string }) => o.companyShortName)).toEqual([
      "Lumen Digital",
      "Lumen Data",
    ]);
    expect(offerIds(response.body)).toEqual([OFFER.CLIENT_PORTAL, OFFER.DATA_QUALITY]);
  });

  it("n'expose que les champs du DTO", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ);

    expect(Object.keys(response.body[0]).sort()).toEqual(
      ["academicYear", "companyShortName", "id", "period", "status", "title"],
    );
  });
});

describe("GET /offers : filtre par période", () => {
  it("conserve toutes les offres quand period est absent", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10);
  });

  it.each(["P1", "P2", "OTHER"])("filtre les offres sur la période %s", async (period) => {
    const response = await listOffersAsPeriod("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, period);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((offer: { period: string }) => offer.period === period)).toBe(true);
  });

  it("combine la période avec les offres publiées visibles par un étudiant", async () => {
    const response = await listOffersAsPeriod("STUDENT", STUDENT.LUCAS_DUPONT, "P2");

    expect(response.status).toBe(200);
    expect(offerIds(response.body)).toEqual([
      OFFER.INTERNAL_CHATBOT,
      OFFER.DATA_QUALITY,
      OFFER.FLEET_APP,
      OFFER.BILLING_API,
    ]);
    expect(
      response.body.every(
        (offer: { period: string; status: string }) =>
          offer.period === "P2" && offer.status === "PUBLISHED",
      ),
    ).toBe(true);
  });

  it("combine la période avec les offres propres à un déposant", async () => {
    const response = await listOffersAsPeriod("CONTACT", CONTACT.MARC_LEJEUNE, "P1");

    expect(response.status).toBe(200);
    expect(offerIds(response.body)).toEqual([OFFER.PDF_REPORTS]);
  });

  it("conserve le refus pour un contact sans droit, même avec une période", async () => {
    const response = await listOffersAsPeriod("CONTACT", CONTACT.NADIA_CHERIF, "P1");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it.each(["", "P3", "p1"])("refuse la période invalide %j", async (period) => {
    const response = await listOffersAsPeriod("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, period);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_QUERY");
  });

  it("refuse un paramètre period répété", async () => {
    const response = await request(app)
      .get("/offers?period=P1&period=P2")
      .set("Authorization", tokenFor("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_QUERY");
  });
});

describe("GET /offers : recherche par titre", () => {
  it("recherche une expression dans le titre sans distinguer la casse ni les espaces extérieurs", async () => {
    const response = await listOffersAsTitle(
      "ADMIN",
      ADMINISTRATOR.ANNE_LECLERCQ,
      "  RAPPORTS PDF  ",
    );

    expect(response.status).toBe(200);
    expect(offerIds(response.body)).toEqual([OFFER.PDF_REPORTS]);
    expect(response.body[0].title).toBe("Module de rapports PDF");
  });

  it.each(["", "   "])("conserve la liste normale pour la recherche vide %j", async (title) => {
    const unfiltered = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ);
    const response = await listOffersAsTitle("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, title);

    expect(unfiltered.status).toBe(200);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(unfiltered.body);
    expect(response.body).toHaveLength(10);
  });

  it("combine la recherche par titre avec la période et la visibilité étudiante", async () => {
    const response = await request(app)
      .get("/offers")
      .query({ title: "  qualité des données  ", period: "P2" })
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT));

    expect(response.status).toBe(200);
    expect(offerIds(response.body)).toEqual([OFFER.DATA_QUALITY]);
    expect(
      response.body.every(
        (offer: { title: string; period: string; status: string }) =>
          offer.title === "Tableau de bord de qualité des données" &&
          offer.period === "P2" &&
          offer.status === "PUBLISHED",
      ),
    ).toBe(true);
  });

  it("retourne une liste vide quand le titre ne correspond pas", async () => {
    const response = await listOffersAsTitle("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "titre absent");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("recherche plusieurs mots comme une expression entière", async () => {
    const response = await listOffersAsTitle(
      "ADMIN",
      ADMINISTRATOR.ANNE_LECLERCQ,
      "rapports pdf",
    );

    expect(response.status).toBe(200);
    expect(offerIds(response.body)).toEqual([OFFER.PDF_REPORTS]);
    const reversed = await listOffersAsTitle("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "pdf rapports");
    expect(reversed.status).toBe(200);
    expect(reversed.body).toEqual([]);
  });

  it.each([
    [100, 200],
    [101, 400],
  ])("applique la limite à un titre de %i caractères", async (length, status) => {
    const response = await listOffersAsTitle("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "x".repeat(length));
    expect(response.status).toBe(status);
    if (status === 400) expect(response.body.error.code).toBe("INVALID_QUERY");
    else expect(response.body).toEqual([]);
  });

  it("refuse un paramètre title répété au lieu de l'ignorer", async () => {
    const response = await request(app)
      .get("/offers?title=API&title=React")
      .set("Authorization", tokenFor("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ));
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_QUERY");
  });

  it.each(["%", "_", "\\"])("cherche le caractère littéral %j sans élargir les résultats", async (title) => {
    // La fixture reste dans la base en mémoire de ce test, jamais dans le seed de développement.
    database.prepare("UPDATE offers SET title = ? WHERE id = ?")
      .run("Stage 100% : API_v2 \\ factures", OFFER.BILLING_API);
    const response = await listOffersAsTitle("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, title);
    expect(response.status).toBe(200);
    expect(offerIds(response.body)).toEqual([OFFER.BILLING_API]);
  });

  it.each(["réservations, entretiens", "Lumen Digital"])(
    "ne cherche pas %j dans la description ou l'entreprise",
    async (title) => {
      const response = await listOffersAsTitle("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, title);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    },
  );

  it("ne révèle pas une offre non publiée dont le titre correspond", async () => {
    const admin = await listOffersAsTitle("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "portail client");
    const student = await listOffersAsTitle("STUDENT", STUDENT.LUCAS_DUPONT, "portail client");
    expect(admin.status).toBe(200);
    expect(offerIds(admin.body)).toEqual([OFFER.CLIENT_PORTAL]);
    expect(student.status).toBe(200);
    expect(student.body).toEqual([]);
  });

  it("n'élargit pas les droits d'un déposant quand le titre d'un collègue correspond", async () => {
    const owner = await listOffersAsTitle("CONTACT", CONTACT.JULIEN_LAMBERT, "portail client");
    const colleague = await listOffersAsTitle("CONTACT", CONTACT.CLAIRE_DUMONT, "portail client");
    expect(owner.status).toBe(200);
    expect(offerIds(owner.body)).toEqual([OFFER.CLIENT_PORTAL]);
    expect(colleague.status).toBe(200);
    expect(colleague.body).toEqual([]);
  });

  it("exclut une offre au titre correspondant si elle appartient à une autre période", async () => {
    const response = await request(app).get("/offers")
      .query({ title: "rapports pdf", period: "P2" })
      .set("Authorization", tokenFor("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ));
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
