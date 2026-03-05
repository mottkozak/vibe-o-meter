import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { AnswerMap, AxisScores, CompassDefinition, Question } from "../types";
import { calculateAxisScores, createInitialAxisScores, isQuizComplete } from "../lib/scoring";

export type QuizLength = 30 | 40 | 50;

const ALLOWED_QUIZ_LENGTHS: QuizLength[] = [30, 40, 50];

interface QuizContextValue {
  questions: Question[];
  selectedQuizLength: QuizLength | null;
  answers: AnswerMap;
  axisScores: AxisScores;
  currentQuestionIndex: number;
  answeredCount: number;
  isComplete: boolean;
  setQuizLength: (length: QuizLength) => void;
  selectAnswer: (questionId: string, answerId: string) => void;
  goToQuestion: (index: number) => void;
  restartQuiz: () => void;
}

interface QuizProviderProps extends PropsWithChildren {
  allQuestions: Question[];
  compasses: CompassDefinition[];
}

const QuizContext = createContext<QuizContextValue | null>(null);

function buildQuestionsForLength(
  allQuestions: Question[],
  compasses: CompassDefinition[],
  length: QuizLength | null
): Question[] {
  if (!length) {
    return [];
  }

  if (!ALLOWED_QUIZ_LENGTHS.includes(length)) {
    return [];
  }

  const questionCountPerCompass = Math.floor(length / compasses.length);
  const byCompass = new Map<string, Question[]>();

  for (const question of allQuestions) {
    const bucket = byCompass.get(question.compassId) ?? [];
    bucket.push(question);
    byCompass.set(question.compassId, bucket);
  }

  const selectedQuestions: Question[] = [];
  for (const compass of compasses) {
    const compassQuestions = byCompass.get(compass.id) ?? [];
    selectedQuestions.push(...compassQuestions.slice(0, questionCountPerCompass));
  }

  return selectedQuestions;
}

export function QuizProvider({ children, allQuestions, compasses }: QuizProviderProps): JSX.Element {
  const [selectedQuizLength, setSelectedQuizLength] = useState<QuizLength | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [axisScores, setAxisScores] = useState<AxisScores>(createInitialAxisScores);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const questions = useMemo(() => {
    return buildQuestionsForLength(allQuestions, compasses, selectedQuizLength);
  }, [allQuestions, compasses, selectedQuizLength]);

  const setQuizLength = useCallback((length: QuizLength) => {
    setSelectedQuizLength(length);
    setAnswers({});
    setAxisScores(createInitialAxisScores());
    setCurrentQuestionIndex(0);
  }, []);

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

  useEffect(() => {
    setCurrentQuestionIndex((prev) => Math.min(prev, Math.max(questions.length - 1, 0)));
  }, [questions.length]);

  const answeredCount = useMemo(() => {
    return questions.reduce((count, question) => {
      return answers[question.id] ? count + 1 : count;
    }, 0);
  }, [answers, questions]);

  const isComplete = useMemo(() => {
    if (!selectedQuizLength || questions.length === 0) {
      return false;
    }
    return isQuizComplete(questions, answers);
  }, [questions, answers, selectedQuizLength]);

  const contextValue = useMemo<QuizContextValue>(
    () => ({
      questions,
      selectedQuizLength,
      answers,
      axisScores,
      currentQuestionIndex,
      answeredCount,
      isComplete,
      setQuizLength,
      selectAnswer,
      goToQuestion,
      restartQuiz
    }),
    [
      questions,
      selectedQuizLength,
      answers,
      axisScores,
      currentQuestionIndex,
      answeredCount,
      isComplete,
      setQuizLength,
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
