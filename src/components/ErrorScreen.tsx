interface ErrorScreenProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorScreen({ title, message, onRetry }: ErrorScreenProps): JSX.Element {
  return (
    <main className="screen-shell">
      <section className="card error-card">
        <h1>{title}</h1>
        <p>{message}</p>
        {onRetry ? (
          <button className="primary-button" type="button" onClick={onRetry}>
            Totally Try Again
          </button>
        ) : null}
      </section>
    </main>
  );
}
