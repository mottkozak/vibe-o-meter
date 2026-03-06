import { useNavigate } from "react-router-dom";
import { useQuiz } from "../state/QuizContext";
import type { LoadedAppData } from "../types";

interface LandingPageProps {
  data: LoadedAppData;
}

const LANDING_INTRO_LINES = [
  "What is up, dude.",
  "Answer a few questions and the get assigned a random everyday object that perfectly matches your aura."
] as const;

const LANDING_OBJECT_LINES = [
  "You might be a Spoon.",
  "You might be a Traffic Cone.",
  "You might be a Rubber Band."
] as const;

const LANDING_OUTRO_LINES = [
  "No one knows.",
  "It’s not science.",
  "But it's close enough.",
  "Let’s find out what you are."
] as const;

export function LandingPage({ data }: LandingPageProps): JSX.Element {
  const navigate = useNavigate();
  const {
    answeredCount,
    isComplete,
    restartQuiz,
    questions,
    selectedQuizLength,
    setQuizLength
  } = useQuiz();
  const hasInProgressAnswers = answeredCount > 0 && !isComplete;

  return (
    <main className="screen-shell">
      <section className="card landing-card">
        <p className="eyebrow">
          The Transdimensional Multiaxial Psycho-Archetypal Resonance Alignment Calibration
          Apparatus
        </p>
        <h1>{data.resultsContent.landingTitle}</h1>
        <div className="landing-copy">
          <div className="landing-copy-block">
            {LANDING_INTRO_LINES.map((paragraph) => (
              <p key={paragraph} className="subtitle landing-line">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="landing-copy-block landing-object-list">
            {LANDING_OBJECT_LINES.map((paragraph) => (
              <p key={paragraph} className="subtitle landing-line">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="landing-copy-block landing-outro">
            {LANDING_OUTRO_LINES.map((paragraph) => (
              <p key={paragraph} className="subtitle landing-line">
                {paragraph}
              </p>
            ))}
          </div>

          <p className="subtitle landing-meta">~ 30 questions • about 2 minutes</p>
        </div>

        <div className="button-row">
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setQuizLength(30);
              navigate("/quiz");
            }}
          >
            Kinda Accurate (30 Questions)
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setQuizLength(40);
              navigate("/quiz");
            }}
          >
            Mostly Accurate (40 Questions)
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setQuizLength(50);
              navigate("/quiz");
            }}
          >
            Extremely Accurate (50 Questions)
          </button>
        </div>
        {hasInProgressAnswers && selectedQuizLength ? (
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={() => navigate("/quiz")}>
              Continue Current Quiz ({selectedQuizLength})
            </button>
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
          </div>
        ) : null}

        <p className="progress-note">~ 30 questions • about 5 minutes</p>
      </section>
    </main>
  );
}
