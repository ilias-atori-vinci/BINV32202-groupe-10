import type { Db } from "../db/database.ts";
import type { ApplicationDbo } from "../models/application.ts";
import type { OfferStatus } from "../models/offer.ts";

interface InsertParams {
  offerId: number;
  studentId: number;
  message: string | null;
}

export const createApplicationsRepository = (db: Db) => {
  const findOfferStatus = db.prepare<[number], { status: OfferStatus }>(
    "SELECT status FROM offers WHERE id = ?",
  );
  const findActive = db.prepare<[number, number], ApplicationDbo>(`
    SELECT id, offer_id, student_id, message, status, applied_at
    FROM applications
    WHERE offer_id = ? AND student_id = ? AND status <> 'WITHDRAWN'
  `);
  const insert = db.prepare<InsertParams>(`
    INSERT INTO applications (offer_id, student_id, message)
    SELECT @offerId, @studentId, @message
    WHERE NOT EXISTS (
      SELECT 1
      FROM applications
      WHERE offer_id = @offerId
        AND student_id = @studentId
        AND status <> 'WITHDRAWN'
    )
  `);
  const findById = db.prepare<[number], ApplicationDbo>(`
    SELECT id, offer_id, student_id, message, status, applied_at
    FROM applications
    WHERE id = ?
  `);

  return {
    findOfferStatus: (offerId: number): OfferStatus | undefined =>
      findOfferStatus.get(offerId)?.status,
    findActive: (offerId: number, studentId: number): ApplicationDbo | undefined =>
      findActive.get(offerId, studentId),
    create: (params: InsertParams): ApplicationDbo | undefined => {
      const result = insert.run(params);
      return result.changes === 0 ? undefined : findById.get(Number(result.lastInsertRowid));
    },

  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
