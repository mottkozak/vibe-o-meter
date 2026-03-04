import { useNavigate } from "react-router-dom";
import { useQuiz } from "../state/QuizContext";
import type { LoadedAppData } from "../types";

interface LandingPageProps {
  data: LoadedAppData;
}

export function LandingPage({ data }: LandingPageProps): JSX.Element {
  const navigate = useNavigate();
  const { answeredCount, isComplete, restartQuiz, questions } = useQuiz();

  const hasInProgressAnswers = answeredCount > 0 && !isComplete;

  return (
    <main className="screen-shell">
      <section className="card landing-card">
        <p className="eyebrow">Totally Scientific Personality Alignment Tool</p>
        <h1>{data.resultsContent.landingTitle}</h1>
        <p className="subtitle">{data.resultsContent.landingSubtitle}</p>
        <p className="muted">{data.resultsContent.disclaimer}</p>

        <div className="button-row">
          <button className="primary-button" type="button" onClick={() => navigate("/quiz")}> 
            {hasInProgressAnswers ? "Continue Quiz" : data.resultsContent.startButtonLabel}
          </button>
          {answeredCount > 0 ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                restartQuiz();
                navigate("/");
              }}
            >
              {data.resultsContent.restartButtonLabel}
            </button>
          ) : null}
        </div>

        <p className="progress-note">
          5 compasses · 30 questions · 64 type outcomes
          {answeredCount > 0
            ? ` · Saved answers: ${answeredCount}/${questions.length}`
            : ""}
        </p>
      </section>
    </main>
  );
}
