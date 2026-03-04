import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompassMiniChart } from "../components/CompassMiniChart";
import { resolveCompassResult } from "../lib/scoring";
import { useQuiz } from "../state/QuizContext";
import type { CompassDefinition, LoadedAppData, Question } from "../types";

interface QuizPageProps {
  data: LoadedAppData;
}

function getSectionQuestions(questions: Question[], compassId: string): Question[] {
  return questions.filter((question) => question.compassId === compassId);
}

function findCurrentCompass(
  compasses: CompassDefinition[],
  compassId: string
): CompassDefinition | undefined {
  return compasses.find((compass) => compass.id === compassId);
}

export function QuizPage({ data }: QuizPageProps): JSX.Element {
  const navigate = useNavigate();
  const [reviewCompassId, setReviewCompassId] = useState<string | null>(null);
  const {
    questions,
    answers,
    axisScores,
    answeredCount,
    currentQuestionIndex,
    goToQuestion,
    isComplete,
    restartQuiz,
    selectAnswer
  } = useQuiz();

  const totalQuestions = questions.length;

  useEffect(() => {
    if (totalQuestions > 0 && currentQuestionIndex >= totalQuestions) {
      goToQuestion(totalQuestions - 1);
    }
  }, [currentQuestionIndex, goToQuestion, totalQuestions]);

  if (totalQuestions === 0) {
    return (
      <main className="screen-shell">
        <section className="card error-card">
          <h1>Quiz Content Missing</h1>
          <p>No questions were loaded.</p>
          <button className="primary-button" type="button" onClick={() => navigate("/")}> 
            Back to Landing
          </button>
        </section>
      </main>
    );
  }

  const activeQuestion = questions[Math.min(currentQuestionIndex, totalQuestions - 1)];
  const activeCompass = findCurrentCompass(data.compasses.compasses, activeQuestion.compassId);

  if (!activeCompass) {
    return (
      <main className="screen-shell">
        <section className="card error-card">
          <h1>Quiz Configuration Error</h1>
          <p>The current question references an unknown compass section.</p>
          <button className="primary-button" type="button" onClick={() => navigate("/")}> 
            Back to Landing
          </button>
        </section>
      </main>
    );
  }

  const sectionQuestions = getSectionQuestions(questions, activeCompass.id);
  const sectionQuestionIndex = sectionQuestions.findIndex(
    (question) => question.id === activeQuestion.id
  );
  const selectedAnswerId = answers[activeQuestion.id];
  const sectionComplete = sectionQuestions.every((question) => Boolean(answers[question.id]));
  const isLastQuestionInSection = sectionQuestionIndex === sectionQuestions.length - 1;
  const shouldOfferSectionReview = isLastQuestionInSection && sectionComplete;
  const shouldShowSectionReview = reviewCompassId === activeCompass.id && sectionComplete;

  const unansweredIndex = questions.findIndex((question) => !answers[question.id]);
  const sectionResult = useMemo(() => {
    if (!shouldShowSectionReview) {
      return null;
    }
    return resolveCompassResult(activeCompass, axisScores);
  }, [activeCompass, axisScores, shouldShowSectionReview]);

  useEffect(() => {
    setReviewCompassId(null);
  }, [currentQuestionIndex]);

  return (
    <main className="screen-shell">
      <section className="card quiz-card">
        <div className="quiz-head">
          <div>
            <p className="eyebrow">
              {activeCompass.name} — {sectionQuestionIndex + 1} of {sectionQuestions.length}
            </p>
            <h1>{activeQuestion.prompt}</h1>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              restartQuiz();
              setReviewCompassId(null);
              navigate("/");
            }}
          >
            Restart
          </button>
        </div>

        <p className="progress-note">
          Global progress: {currentQuestionIndex + 1} / {totalQuestions} · Answered: {answeredCount} / 
          {totalQuestions}
        </p>

        <div className="answers-grid">
          {activeQuestion.answers.map((answer) => (
            <button
              key={answer.id}
              className={`answer-button ${selectedAnswerId === answer.id ? "selected" : ""}`}
              type="button"
              onClick={() => selectAnswer(activeQuestion.id, answer.id)}
            >
              <span className="answer-id">{answer.id}</span>
              <span>{answer.text}</span>
            </button>
          ))}
        </div>

        <div className="button-row">
          <button
            className="secondary-button"
            type="button"
            disabled={currentQuestionIndex === 0}
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
          >
            Previous
          </button>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <button
              className="primary-button"
              type="button"
              disabled={!selectedAnswerId}
              onClick={() => {
                if (shouldOfferSectionReview && !shouldShowSectionReview) {
                  setReviewCompassId(activeCompass.id);
                  return;
                }
                goToQuestion(currentQuestionIndex + 1);
              }}
            >
              {shouldOfferSectionReview && !shouldShowSectionReview
                ? "View Section Grid"
                : "Next"}
            </button>
          ) : (
            <button
              className="primary-button"
              type="button"
              disabled={!isComplete}
              onClick={() => {
                if (shouldOfferSectionReview && !shouldShowSectionReview) {
                  setReviewCompassId(activeCompass.id);
                  return;
                }
                navigate("/results");
              }}
            >
              {shouldOfferSectionReview && !shouldShowSectionReview
                ? "View Section Grid"
                : "See Results"}
            </button>
          )}
        </div>

        {shouldShowSectionReview && sectionResult ? (
          <section className="household-section">
            <h2>{activeCompass.name} Complete</h2>
            <p className="muted">Here is where your answers place you on this section grid.</p>
            <CompassMiniChart
              title={activeCompass.name}
              quadrantLabel={sectionResult.quadrant.label}
              x={sectionResult.x}
              y={sectionResult.y}
              confidence={Math.max(
                0,
                Math.min(100, Math.round(((Math.abs(sectionResult.x) + Math.abs(sectionResult.y)) / 24) * 100))
              )}
              xAxis={data.compasses.axes[activeCompass.xAxis]}
              yAxis={data.compasses.axes[activeCompass.yAxis]}
            />
            <div className="button-row">
              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => goToQuestion(currentQuestionIndex + 1)}
                >
                  Continue to Next Section
                </button>
              ) : (
                <button className="primary-button" type="button" onClick={() => navigate("/results")}>
                  Continue to Results
                </button>
              )}
            </div>
          </section>
        ) : null}

        {!isComplete && unansweredIndex >= 0 && currentQuestionIndex === totalQuestions - 1 ? (
          <p className="muted">
            Complete all questions to view results. First unanswered question: {unansweredIndex + 1}.
          </p>
        ) : null}
      </section>
    </main>
  );
}
