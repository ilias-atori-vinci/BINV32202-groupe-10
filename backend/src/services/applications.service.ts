import { toApplication, toApplicationListDto } from "../mappers/application.mapper.ts";
import type { Application, ApplicationListDto } from "../models/application.ts";
import type { User } from "../models/user.ts";
import type { ApplicationsRepository } from "../repositories/applications.repository.ts";
import { HttpError } from "../utils/httpError.ts";
import { isStudent } from "./permissions.ts";

const assertStudent = (viewer: User): void => {
  if (!isStudent(viewer)) {
    throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut candidater");
  }
};

export const createApplicationsService = (repository: ApplicationsRepository) => ({
  listApplications: (viewer: User): ApplicationListDto[] => {
    assertStudent(viewer);
    return repository.findAllForStudent(viewer.id).map(toApplicationListDto);
  },
  createApplication: (
    viewer: User,
    offerId: number,
    message: string | null,
  ): Application => {
    assertStudent(viewer);

    const offerStatus = repository.findOfferStatus(offerId);
    if (offerStatus === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Cette offre n'existe pas");
    }
    if (offerStatus !== "PUBLISHED") {
      throw new HttpError(409, "OFFER_NOT_PUBLISHED", "Cette offre n'est pas publiée");
    }
    const application = repository.create({ offerId, studentId: viewer.id, message });
    if (application === undefined) {
      throw new HttpError(409, "APPLICATION_EXISTS", "Vous avez déjà candidaté à cette offre");
    }
    return toApplication(application);
  },
  withdrawApplication: (viewer: User, applicationId: number): Application => {
    assertStudent(viewer);

    const application = repository.findById(applicationId);
    if (application === undefined) {
      throw new HttpError(404, "NOT_FOUND", "Cette candidature n'existe pas");
    }
    if (application.student_id !== viewer.id) {
      throw new HttpError(403, "FORBIDDEN", "Vous ne pouvez pas retirer cette candidature");
    }
    if (application.status !== "IN_PROGRESS") {
      throw new HttpError(
        409,
        "APPLICATION_NOT_WITHDRAWABLE",
        "Cette candidature ne peut plus être retirée",
      );
    }

    const withdrawn = repository.withdraw(applicationId, viewer.id);
    if (withdrawn === undefined) {
      throw new HttpError(
        409,
        "APPLICATION_NOT_WITHDRAWABLE",
        "Cette candidature ne peut plus être retirée",
      );
    }
    return toApplication(withdrawn);
  },
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
