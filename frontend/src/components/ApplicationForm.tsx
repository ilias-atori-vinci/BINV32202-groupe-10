import { useState } from "react";

const MAX_MESSAGE_LENGTH = 2000;

interface ApplicationFormProps {
  offerTitle: string;
  isSubmitting: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (message: string) => void;
}

const ApplicationForm = ({
  offerTitle,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: ApplicationFormProps) => {
  const [message, setMessage] = useState("");

  return (
    <form
      className="application-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(message);
      }}
    >
      <h2>Candidater à « {offerTitle} »</h2>
      <label htmlFor="application-message">Message (facultatif)</label>
      <textarea
        id="application-message"
        maxLength={MAX_MESSAGE_LENGTH}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={5}
      />
      <p className="field-help">{message.length}/{MAX_MESSAGE_LENGTH} caractères</p>
      {error && <p className="state state-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Envoi…" : "Envoyer ma candidature"}
        </button>
        <button className="button" type="button" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </button>
      </div>
    </form>
  );
};

export default ApplicationForm;
