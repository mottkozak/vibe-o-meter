import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const {
    questions,
    answers,
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

  const unansweredIndex = questions.findIndex((question) => !answers[question.id]);

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
              onClick={() => goToQuestion(currentQuestionIndex + 1)}
            >
              Next
            </button>
          ) : (
            <button
              className="primary-button"
              type="button"
              disabled={!isComplete}
              onClick={() => navigate("/results")}
            >
              See Results
            </button>
          )}
        </div>

        {!isComplete && unansweredIndex >= 0 && currentQuestionIndex === totalQuestions - 1 ? (
          <p className="muted">
            Complete all questions to view results. First unanswered question: {unansweredIndex + 1}.
          </p>
        ) : null}
      </section>
    </main>
  );
}
