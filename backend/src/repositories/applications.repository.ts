import type { Db } from "../db/database.ts";
import type { ApplicationDbo, ApplicationListDbo } from "../models/application.ts";
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
  const insert = db.prepare<InsertParams>(`
    INSERT INTO applications (offer_id, student_id, message)
    VALUES (@offerId, @studentId, @message)
    ON CONFLICT (student_id, offer_id) WHERE status <> 'WITHDRAWN' DO NOTHING
  `);
  const findById = db.prepare<[number], ApplicationDbo>(`
    SELECT id, offer_id, student_id, message, status, applied_at
    FROM applications
    WHERE id = ?
  `);
  const findAllForStudent = db.prepare<[number], ApplicationListDbo>(`
    SELECT a.id, a.offer_id, a.student_id, a.message, a.status, a.applied_at,
           o.title AS offer_title,
           c.short_name AS company_short_name,
           ay.label AS academic_year_label,
           p.code AS period_code
    FROM applications a
    JOIN offers o ON o.id = a.offer_id
    JOIN companies c ON c.id = o.company_id
    JOIN academic_years ay ON ay.id = o.academic_year_id
    JOIN periods p ON p.id = o.period_id
    WHERE a.student_id = ?
    ORDER BY a.applied_at DESC, a.id DESC
  `);
  const withdraw = db.prepare<[number, number]>(`
    UPDATE applications
    SET status = 'WITHDRAWN'
    WHERE id = ? AND student_id = ? AND status = 'IN_PROGRESS'
  `);

  return {
    findOfferStatus: (offerId: number): OfferStatus | undefined =>
      findOfferStatus.get(offerId)?.status,
    create: (params: InsertParams): ApplicationDbo | undefined => {
      const result = insert.run(params);
      return result.changes === 0 ? undefined : findById.get(Number(result.lastInsertRowid));
    },
    findAllForStudent: (studentId: number): ApplicationListDbo[] =>
      findAllForStudent.all(studentId),
    findById: (applicationId: number): ApplicationDbo | undefined =>
      findById.get(applicationId),
    withdraw: (applicationId: number, studentId: number): ApplicationDbo | undefined => {
      const result = withdraw.run(applicationId, studentId);
      return result.changes === 0 ? undefined : findById.get(applicationId);
    },
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
