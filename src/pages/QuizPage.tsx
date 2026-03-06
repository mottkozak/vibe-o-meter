import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompassMiniChart } from "../components/CompassMiniChart";
import { resolveCompassResult } from "../lib/scoring";
import { useQuiz } from "../state/QuizContext";
import type { AxisKey, CompassDefinition, LoadedAppData, QuadrantWriteup, Question } from "../types";

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

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  if (/[.!?]$/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}.`;
}

function toMatrixLabel(value: string): string {
  return value.replace(/compass/gi, "Matrix");
}

function getScanStatusLine(current: number, total: number, seed: number): string {
  const options = [
    `Scanning personality matrix... (${current} / ${total})`,
    `Behavior analysis in progress... (${current} / ${total})`,
    `Collecting personality data... (${current} / ${total})`,
    `Matrix calibration: Question ${current} of ${total}`
  ] as const;
  return options[seed % options.length];
}

function buildSubtypeExplanation(writeup: QuadrantWriteup | null): string {
  if (!writeup) {
    return "This subtype shows where your answers are clustering on this matrix right now.";
  }

  const lead = ensureSentence(writeup.oneLiner);
  const strengths = writeup.strengths
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 2);

  if (strengths.length === 0) {
    return lead;
  }

  return `${lead} Core vibe: ${strengths.join(" and ")}.`;
}

export function QuizPage({ data }: QuizPageProps): JSX.Element {
  const navigate = useNavigate();
  const [reviewCompassId, setReviewCompassId] = useState<string | null>(null);
  const {
    questions,
    selectedQuizLength,
    answers,
    axisScores,
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
          <h1>Game Session Not Started</h1>
          <p>Go back to the intro screen and press Begin first.</p>
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
          <h1>Matrix Vibes Are Crossed</h1>
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

  const sectionResult = useMemo(() => {
    if (!shouldShowSectionReview) {
      return null;
    }
    return resolveCompassResult(activeCompass, axisScores);
  }, [activeCompass, axisScores, shouldShowSectionReview]);
  const sectionMaxDistance = useMemo(() => {
    return getSectionMaxDistance(sectionQuestions, activeCompass.xAxis, activeCompass.yAxis);
  }, [activeCompass.xAxis, activeCompass.yAxis, sectionQuestions]);
  const sectionWriteup = useMemo(() => {
    if (!sectionResult) {
      return null;
    }

    const writeupKey = `${activeCompass.id}.${sectionResult.quadrant.id}`;
    return data.quadrantWriteups.quadrantWriteups[writeupKey] ?? null;
  }, [activeCompass.id, data.quadrantWriteups, sectionResult]);
  const sectionSubtypeExplanation = useMemo(
    () => buildSubtypeExplanation(sectionWriteup),
    [sectionWriteup]
  );
  const activeMatrixName = toMatrixLabel(activeCompass.name);
  const scanStatusLine = getScanStatusLine(
    currentQuestionIndex + 1,
    totalQuestions,
    currentQuestionIndex
  );
  const questionInstruction =
    currentQuestionIndex % 2 === 0
      ? "Choose the response that feels most natural."
      : "Select the option that best matches your instinct.";

  useEffect(() => {
    setReviewCompassId(null);
  }, [currentQuestionIndex]);

  return (
    <main className="screen-shell">
      <section className="card quiz-card">
        <div className="quiz-head">
          <div>
            <p className="eyebrow">{scanStatusLine}</p>
            <p className="subtitle quiz-matrix-label">{activeMatrixName}</p>
            <p className="subtitle quiz-instruction">{questionInstruction}</p>
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
              {shouldOfferSectionReview && !shouldShowSectionReview ? "View Grid" : "Next"}
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
                ? "View Grid"
                : "Reveal Results"}
            </button>
          )}
        </div>

        {shouldShowSectionReview && sectionResult ? (
          <section className="household-section quiz-section-review">
            <div className="quiz-review-layout">
              <div className="quiz-section-chart-wrap">
                <CompassMiniChart
                  title={activeMatrixName}
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
              </div>
              <section className="quiz-subtype-card" aria-label="Subtype explanation">
                <p className="quiz-subtype-kicker">Subtype Classification</p>
                <h3>{sectionResult.quadrant.label}</h3>
                <p>{sectionSubtypeExplanation}</p>
              </section>
            </div>
            <div className="button-row">
              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => goToQuestion(currentQuestionIndex + 1)}
                >
                  Continue
                </button>
              ) : (
                <button className="primary-button" type="button" onClick={() => navigate("/results")}>
                  Continue
                </button>
              )}
            </div>
          </section>
        ) : null}

      </section>
    </main>
  );
}
