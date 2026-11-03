import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import type { UserKind } from "../src/models/user.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const applyAs = (kind: UserKind, id: number, body: object) =>
  request(app)
    .post("/applications")
    .set("Authorization", tokenFor(kind, id))
    .send(body);

const listAs = (kind: UserKind, id: number) =>
  request(app).get("/applications").set("Authorization", tokenFor(kind, id));

const withdrawAs = (kind: UserKind, id: number, applicationId: number) =>
  request(app)
    .delete(`/applications/${applicationId}`)
    .set("Authorization", tokenFor(kind, id));

describe("DELETE /applications/:id", () => {
  it("retire la candidature en cours de l'étudiant connecté", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, 1);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 1, status: "WITHDRAWN" });

    const listResponse = await listAs("STUDENT", STUDENT.LUCAS_DUPONT);
    expect(listResponse.body).toEqual([
      expect.objectContaining({ id: 1, status: "WITHDRAWN" }),
    ]);
  });

  it("refuse le retrait d'une candidature appartenant à un autre étudiant", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, 2);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it.each([
    ["retenue", STUDENT.MATEUSZ_KOWALSKI, 3],
    ["non retenue", STUDENT.LEA_MERTENS, 4],
    ["déjà retirée", STUDENT.INES_HADDAD, 5],
  ])("refuse le retrait d'une candidature %s", async (_label, studentId, applicationId) => {
    const response = await withdrawAs("STUDENT", studentId, applicationId);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_NOT_WITHDRAWABLE");
  });

  it("refuse les rôles autres qu'étudiant", async () => {
    const response = await withdrawAs("ADMIN", 1, 1);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("autorise une nouvelle candidature après le retrait", async () => {
    const withdrawal = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, 1);
    expect(withdrawal.status).toBe(200);

    const application = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.FLEET_APP,
    });
    expect(application.status).toBe(201);
    expect(application.body.status).toBe("IN_PROGRESS");
    expect(application.body.id).not.toBe(1);
  });
});

describe("GET /applications", () => {
  it("retourne les candidatures de l'étudiant connecté avec les informations de l'offre", async () => {
    const response = await listAs("STUDENT", STUDENT.INES_HADDAD);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          offerId: OFFER.FLEET_APP,
          offerTitle: "Application React de gestion de flotte",
          companyShortName: "Lumen Digital",
          academicYear: "2026-2027",
          period: "P2",
          status: "IN_PROGRESS",
        }),
        expect.objectContaining({
          offerId: OFFER.BILLING_API,
          offerTitle: "API REST de facturation",
          status: "WITHDRAWN",
        }),
      ]),
    );
  });

  it("isole les résultats entre deux étudiants", async () => {
    const lucasResponse = await listAs("STUDENT", STUDENT.LUCAS_DUPONT);
    const leaResponse = await listAs("STUDENT", STUDENT.LEA_MERTENS);

    expect(lucasResponse.status).toBe(200);
    expect(leaResponse.status).toBe(200);
    expect(lucasResponse.body).toHaveLength(1);
    expect(lucasResponse.body[0].offerId).toBe(OFFER.FLEET_APP);
    expect(leaResponse.body).toHaveLength(1);
    expect(leaResponse.body[0].status).toBe("REJECTED");
    expect(lucasResponse.body).not.toEqual(expect.arrayContaining(leaResponse.body));
  });

  it("retourne une liste vide pour un étudiant sans candidature", async () => {
    const response = await listAs("STUDENT", STUDENT.DMYTRO_KOVALENKO);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it.each([
    ["ADMIN", 1],
    ["CONTACT", 2],
  ] as const)("refuse la consultation au profil %s", async (kind, id) => {
    const response = await listAs(kind, id);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("refuse la consultation sans session", async () => {
    const response = await request(app).get("/applications");

    expect(response.status).toBe(401);
  });
});

describe("POST /applications", () => {
  it("crée une candidature avec un message pour un étudiant", async () => {
    const response = await applyAs("STUDENT", STUDENT.DMYTRO_KOVALENKO, {
      offerId: OFFER.FLEET_APP,
      message: "  Je souhaite rejoindre votre équipe.  ",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      offerId: OFFER.FLEET_APP,
      message: "Je souhaite rejoindre votre équipe.",
      status: "IN_PROGRESS",
    });
    expect(response.body).not.toHaveProperty("studentId");
  });

  it("crée une candidature sans message", async () => {
    const response = await applyAs("STUDENT", STUDENT.LOUIS_CLAES, {
      offerId: OFFER.BILLING_API,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBeNull();
    expect(response.body.status).toBe("IN_PROGRESS");
  });

  it("refuse une offre qui n'est pas publiée conformément à RG-03", async () => {
    const response = await applyAs("STUDENT", STUDENT.DMYTRO_KOVALENKO, {
      offerId: OFFER.CLIENT_PORTAL,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("OFFER_NOT_PUBLISHED");
  });

  it("refuse une candidature active en doublon", async () => {
    const response = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.FLEET_APP,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_EXISTS");
  });

  it("autorise une nouvelle candidature après un retrait", async () => {
    const response = await applyAs("STUDENT", STUDENT.INES_HADDAD, {
      offerId: OFFER.BILLING_API,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("IN_PROGRESS");
  });

  it("refuse un administrateur et un contact", async () => {
    const adminResponse = await applyAs("ADMIN", 1, { offerId: OFFER.FLEET_APP });
    const contactResponse = await applyAs("CONTACT", 2, { offerId: OFFER.FLEET_APP });

    expect(adminResponse.status).toBe(403);
    expect(contactResponse.status).toBe(403);
  });

  it("refuse un message de plus de 2 000 caractères", async () => {
    const response = await applyAs("STUDENT", STUDENT.DMYTRO_KOVALENKO, {
      offerId: OFFER.FLEET_APP,
      message: "x".repeat(2001),
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_BODY");
  });

  it("utilise l'étudiant de la session et ignore tout studentId envoyé", async () => {
    const response = await applyAs("STUDENT", STUDENT.DMYTRO_KOVALENKO, {
      offerId: OFFER.FLEET_APP,
      studentId: STUDENT.LUCAS_DUPONT,
    });

    expect(response.status).toBe(201);
    expect(response.body.offerId).toBe(OFFER.FLEET_APP);
  });
});
