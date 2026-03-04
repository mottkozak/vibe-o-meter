import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { AnswerMap, AxisScores, Question } from "../types";
import { calculateAxisScores, createInitialAxisScores, isQuizComplete } from "../lib/scoring";

interface QuizContextValue {
  questions: Question[];
  answers: AnswerMap;
  axisScores: AxisScores;
  currentQuestionIndex: number;
  answeredCount: number;
  isComplete: boolean;
  selectAnswer: (questionId: string, answerId: string) => void;
  goToQuestion: (index: number) => void;
  restartQuiz: () => void;
}

interface QuizProviderProps extends PropsWithChildren {
  questions: Question[];
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children, questions }: QuizProviderProps): JSX.Element {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [axisScores, setAxisScores] = useState<AxisScores>(createInitialAxisScores);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const selectAnswer = useCallback(
    (questionId: string, answerId: string) => {
      setAnswers((previous) => {
        const nextAnswers = {
          ...previous,
          [questionId]: answerId
        };
        setAxisScores(calculateAxisScores(questions, nextAnswers));
        return nextAnswers;
      });
    },
    [questions]
  );

  const goToQuestion = useCallback(
    (index: number) => {
      const maxIndex = Math.max(questions.length - 1, 0);
      const clamped = Math.min(Math.max(index, 0), maxIndex);
      setCurrentQuestionIndex(clamped);
    },
    [questions.length]
  );

  const restartQuiz = useCallback(() => {
    setAnswers({});
    setAxisScores(createInitialAxisScores());
    setCurrentQuestionIndex(0);
  }, []);

  const answeredCount = useMemo(() => {
    return questions.reduce((count, question) => {
      return answers[question.id] ? count + 1 : count;
    }, 0);
  }, [answers, questions]);

  const isComplete = useMemo(() => isQuizComplete(questions, answers), [questions, answers]);

  const contextValue = useMemo<QuizContextValue>(
    () => ({
      questions,
      answers,
      axisScores,
      currentQuestionIndex,
      answeredCount,
      isComplete,
      selectAnswer,
      goToQuestion,
      restartQuiz
    }),
    [
      questions,
      answers,
      axisScores,
      currentQuestionIndex,
      answeredCount,
      isComplete,
      selectAnswer,
      goToQuestion,
      restartQuiz
    ]
  );

  return <QuizContext.Provider value={contextValue}>{children}</QuizContext.Provider>;
}

export function useQuiz(): QuizContextValue {
  const value = useContext(QuizContext);
  if (!value) {
    throw new Error("useQuiz must be used within QuizProvider.");
  }

  return value;
}
