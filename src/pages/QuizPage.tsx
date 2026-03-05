import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompassMiniChart } from "../components/CompassMiniChart";
import { resolveCompassResult } from "../lib/scoring";
import { useQuiz } from "../state/QuizContext";
import type { AxisKey, CompassDefinition, LoadedAppData, Question } from "../types";

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

function maxAxisContribution(question: Question, axis: AxisKey): number {
  return question.answers.reduce((maxAbs, answer) => {
    const delta = answer.delta[axis];
    if (typeof delta !== "number") {
      return maxAbs;
    }
    return Math.max(maxAbs, Math.abs(delta));
  }, 0);
}

function getSectionMaxDistance(
  sectionQuestions: Question[],
  xAxis: AxisKey,
  yAxis: AxisKey
): number {
  const maxX = sectionQuestions.reduce((sum, question) => {
    return sum + maxAxisContribution(question, xAxis);
  }, 0);
  const maxY = sectionQuestions.reduce((sum, question) => {
    return sum + maxAxisContribution(question, yAxis);
  }, 0);
  const maxDistance = maxX + maxY;
  return maxDistance > 0 ? maxDistance : 24;
}

export function QuizPage({ data }: QuizPageProps): JSX.Element {
  const navigate = useNavigate();
  const [reviewCompassId, setReviewCompassId] = useState<string | null>(null);
  const {
    questions,
    selectedQuizLength,
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

  if (!selectedQuizLength) {
    return (
      <main className="screen-shell">
        <section className="card">
          <h1>No Accuracy Mode Selected</h1>
          <p>Pick Kinda, Mostly, or Extremely Accurate on the home screen first.</p>
          <button className="primary-button" type="button" onClick={() => navigate("/")}>
            Back to Home Base
          </button>
        </section>
      </main>
    );
  }

  useEffect(() => {
    if (totalQuestions > 0 && currentQuestionIndex >= totalQuestions) {
      goToQuestion(totalQuestions - 1);
    }
  }, [currentQuestionIndex, goToQuestion, totalQuestions]);

  if (totalQuestions === 0) {
    return (
      <main className="screen-shell">
        <section className="card error-card">
          <h1>Dude, the Questions Vanished</h1>
          <p>Totally nothing loaded, which is most unexcellent.</p>
          <button className="primary-button" type="button" onClick={() => navigate("/")}> 
            Back to Home Base
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
          <h1>Compass Vibes Are Crossed</h1>
          <p>Dude, this question points to a mystery section and we totally lost the map.</p>
          <button className="primary-button" type="button" onClick={() => navigate("/")}> 
            Back to Home Base
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
  const sectionMaxDistance = useMemo(() => {
    return getSectionMaxDistance(sectionQuestions, activeCompass.xAxis, activeCompass.yAxis);
  }, [activeCompass.xAxis, activeCompass.yAxis, sectionQuestions]);

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
          Totally global progress: {currentQuestionIndex + 1} / {totalQuestions} · Answered: {answeredCount} / 
          {totalQuestions} · Mode: {selectedQuizLength}
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
                ? "View Most Excellent Grid"
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
                ? "View Most Excellent Grid"
                : "Reveal Results, Dude"}
            </button>
          )}
        </div>

        {shouldShowSectionReview && sectionResult ? (
          <section className="household-section">
            <h2>{activeCompass.name} Totally Complete</h2>
            <p className="muted">Most excellent. Here is your spot on this gnarly section grid.</p>
            <CompassMiniChart
              title={activeCompass.name}
              quadrantLabel={sectionResult.quadrant.label}
              x={sectionResult.x}
              y={sectionResult.y}
              confidence={Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    ((Math.abs(sectionResult.x) + Math.abs(sectionResult.y)) / sectionMaxDistance) *
                      100
                  )
                )
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
                  Continue to the Next Vibe Zone
                </button>
              ) : (
                <button className="primary-button" type="button" onClick={() => navigate("/results")}>
                  Continue to Final Vibes
                </button>
              )}
            </div>
          </section>
        ) : null}

        {!isComplete && unansweredIndex >= 0 && currentQuestionIndex === totalQuestions - 1 ? (
          <p className="muted">
            Dude, answer every question to unlock results. First unfinished one: {unansweredIndex + 1}.
          </p>
        ) : null}
      </section>
    </main>
  );
}
