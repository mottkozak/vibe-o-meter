import { useNavigate } from "react-router-dom";
import { useQuiz } from "../state/QuizContext";
import type { LoadedAppData } from "../types";

interface LandingPageProps {
  data: LoadedAppData;
}

const LANDING_BODY_PARAGRAPHS = [
  "Greetings, most curious, seeker of vibes.",
  "You are about to embark on a most excellent journey of self-discovery.",
  "Using advanced techniques developed by the most knowledgeable ancient philosopher dudes - and absolutely zero peer-reviewed science - this totally righteous quiz will reveal the hidden alignment of your soul.",
  "I know what you're thinking.",
  "\"Whoa. That is pretty sweet, dude.\"",
  "And honestly... I totally agree, dude.",
  "Through a series of most intelectual questions, we will map your personality across the great forces of human nature.",
  "As you answer each question, your choices will slowly align your personality across these cosmic compasses, until your true archetype emerges from the swirling chaos of the universe.",
  "Double whoa.",
  "Heavy stuff, dude.",
  "So answer honestly.",
  "Trust your instincts.",
  "And the universe will reveal your Most Magnanimous Archetype.",
  "Technically this isn't science.",
  "But it feels pretty scientific, and honestly that's close enough, dude.",
  "You got this, dude.",
  "And remember the ancient wisdom:",
  "Be excellent to each other.",
  "Now... let's do this."
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
          {compassCount} compasses · {totalQuestions} questions · {totalTypeOutcomes} type outcomes
          {answeredCount > 0
            ? ` · Saved answers: ${answeredCount}/${totalQuestions}`
            : ""}
        </p>
      </section>
    </main>
  );
}
