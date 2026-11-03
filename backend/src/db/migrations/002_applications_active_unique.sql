-- Un étudiant ne peut avoir qu'une candidature non retirée pour une offre.
-- Les candidatures retirées restent historisées et peuvent être suivies d'une
-- nouvelle candidature si l'offre est toujours publiée.
CREATE UNIQUE INDEX applications_active_student_offer
  ON applications (student_id, offer_id)
  WHERE status <> 'WITHDRAWN';
