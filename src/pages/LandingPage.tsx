import { useNavigate } from "react-router-dom";
import { useQuiz } from "../state/QuizContext";
import type { LoadedAppData } from "../types";

interface LandingPageProps {
  data: LoadedAppData;
}

const LANDING_BODY_PARAGRAPHS = [
  "What is up dude.",
  "You are about to embark on a most excellent journey of self-discovery.",
  "Using advanced techniques developed by some most knowledgeable philosopher dudes - and no peer-reviewed science - this quiz will reveal the hidden alignment of your soul.",
  "I know what you're thinking.",
  "\"Woah.\"",
  "And honestly dude... I agree.",
  "Through a series of most intellectual questions, it will map your personality across the great forces of human nature. As you answer, your choices will slowly align across the cosmic matrices of destiny, until your true self emerges from the swirling chaos of the universe.",
  "Truthfully, dude, I don't even know what that means. But woah. Just answer honestly and trust your instincts.",
  "Technically this isn't science. But it feels pretty scientific, and honestly that's close enough."
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
