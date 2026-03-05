import { useNavigate } from "react-router-dom";
import { useQuiz } from "../state/QuizContext";
import type { LoadedAppData } from "../types";

interface LandingPageProps {
  data: LoadedAppData;
}

const LANDING_BODY_PARAGRAPHS = [
  "What is up dude.",
  "You are about to embark on a most excellent journey of self-discovery.",
  "Using advanced techniques developed by most knowledgeable philosopher dudes - and no peer-reviewed science - this quiz will reveal the hidden alignment of your soul.",
  "I know what you're thinking.",
  "\"Woah.\"",
  "And honestly... I agree dude.",
  "Through a series of most intellectual questions, it will map your personality across the great forces of human nature. As you answer, your choices will slowly align across the cosmic compasses of destiny, until your true self emerges from the swirling chaos of the universe.",
  "Double woah. Heavy stuff. I don't even know what that means. Just answer honestly and trust your instincts.",
  "Technically this isn't science. But it feels pretty scientific, and honestly that's close enough, dude."
] as const;

export function LandingPage({ data }: LandingPageProps): JSX.Element {
  const navigate = useNavigate();
  const { answeredCount, isComplete, restartQuiz, questions } = useQuiz();
  const compassCount = data.compasses.compasses.length;
  const totalQuestions = questions.length;
  const totalTypeOutcomes = Object.values(data.typeTitles.families).reduce((sum, family) => {
    return sum + family.titles16.length;
  }, 0);

  const hasInProgressAnswers = answeredCount > 0 && !isComplete;

  return (
    <main className="screen-shell">
      <section className="card landing-card">
        <p className="eyebrow">Totally Scientific Personality Alignment Tool</p>
        <h1>{data.resultsContent.landingTitle}</h1>
        {LANDING_BODY_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph} className="subtitle">
            {paragraph}
          </p>
        ))}

        <div className="button-row">
          <button className="primary-button" type="button" onClick={() => navigate("/quiz")}> 
            {hasInProgressAnswers ? "Continue Quiz" : "Let's do this"}
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
          {compassCount} compasses · {totalQuestions} questions · {totalTypeOutcomes} type outcomes
          {answeredCount > 0
            ? ` · Saved answers: ${answeredCount}/${totalQuestions}`
            : ""}
        </p>
      </section>
    </main>
  );
}
