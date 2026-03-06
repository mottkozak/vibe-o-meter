import { useNavigate } from "react-router-dom";
import { useQuiz } from "../state/QuizContext";
import type { LoadedAppData } from "../types";

interface LandingPageProps {
  data: LoadedAppData;
}

const LANDING_BODY_PARAGRAPHS = [
  "What is up, dude.",
  "Answer a few questions and the get assigned a random everyday object that perfectly matches your aura.",
  "You might be a Spoon.",
  "You might be a Traffic Cone.",
  "You might be a Rubber Band.",
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
  const compassCount = data.compasses.compasses.length;
  const totalQuestions = selectedQuizLength ?? 0;
  const totalTypeOutcomes = Object.values(data.typeTitles.families).reduce((sum, family) => {
    return sum + family.titles16.length;
  }, 0);

  const hasInProgressAnswers = answeredCount > 0 && !isComplete;

  return (
    <main className="screen-shell">
      <section className="card landing-card">
        <p className="eyebrow">
          The Transdimensional Multiaxial Psycho-Archetypal Resonance Alignment Calibration
          Apparatus
        </p>
        <h1>{data.resultsContent.landingTitle}</h1>
        {LANDING_BODY_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph} className="subtitle">
            {paragraph}
          </p>
        ))}
        <p className="subtitle">~ 30 questions • about 2 minutes</p>

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

        <p className="progress-note">
          {compassCount} matrices ·{" "}
          {selectedQuizLength ? `${totalQuestions} selected questions` : "choose 30, 40, or 50 questions"}{" "}
          · {totalTypeOutcomes} type outcomes
          {selectedQuizLength && answeredCount > 0
            ? ` · Saved answers: ${answeredCount}/${totalQuestions}`
            : ""}
        </p>
      </section>
    </main>
  );
}
