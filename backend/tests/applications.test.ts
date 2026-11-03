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
