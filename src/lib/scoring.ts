import {
  AXIS_KEYS,
  TYPE_CODE_AXES_DEFAULT,
  type AnswerMap,
  type AxisScores,
  type CompassDefinition,
  type CompassResult,
  type Question,
  type TypeCodeAxis,
  type TypeTitleResolution,
  type TypeTitlesData
} from "../types";

const POSITIVE_LETTER_BY_AXIS: Record<TypeCodeAxis, string> = {
  VW: "V",
  HG: "H",
  KP: "K",
  RJ: "R",
  SC: "S",
  MA: "M"
};

const NEGATIVE_LETTER_BY_AXIS: Record<TypeCodeAxis, string> = {
  VW: "W",
  HG: "G",
  KP: "P",
  RJ: "J",
  SC: "C",
  MA: "A"
};

const BIT_AXIS_LETTERS = {
  KP: { positive: "K", negative: "P" },
  RJ: { positive: "R", negative: "J" },
  SC: { positive: "S", negative: "C" },
  MA: { positive: "M", negative: "A" }
} as const;

function normalizeWhenExpression(when: string): string {
  return when.replace(/\s+/g, "").toLowerCase();
}

function getQuadrantConditionForScore(x: number, y: number): string {
  const horizontal = x > 0 ? "x>0" : "x<0";
  const vertical = y >= 0 ? "y>0" : "y<0";
  return `${horizontal}&&${vertical}`;
}

function getQuadrantIndexFallback(x: number, y: number): number {
  if (x > 0 && y >= 0) {
    return 0;
  }

  if (x <= 0 && y >= 0) {
    return 1;
  }

  if (x > 0 && y < 0) {
    return 2;
  }

  return 3;
}

export function createInitialAxisScores(): AxisScores {
  return {
    VW: 0,
    HG: 0,
    KP: 0,
    RJ: 0,
    SC: 0,
    ST: 0,
    PT: 0,
    QR: 0,
    GP: 0,
    MA: 0
  };
}

export function calculateAxisScores(questions: Question[], answers: AnswerMap): AxisScores {
  const scores = createInitialAxisScores();
  const questionById = new Map(questions.map((question) => [question.id, question]));

  for (const [questionId, answerId] of Object.entries(answers)) {
    const question = questionById.get(questionId);
    if (!question) {
      continue;
    }

    const answer = question.answers.find((candidate) => candidate.id === answerId);
    if (!answer) {
      continue;
    }

    for (const axis of AXIS_KEYS) {
      const delta = answer.delta[axis];
      if (typeof delta === "number") {
        scores[axis] += delta;
      }
    }
  }

  return scores;
}

export function resolveCompassResult(compass: CompassDefinition, scores: AxisScores): CompassResult {
  const x = scores[compass.xAxis];
  const y = scores[compass.yAxis];

  const expectedCondition = getQuadrantConditionForScore(x, y);
  const normalizedExpected = normalizeWhenExpression(expectedCondition);

  const matchedQuadrant = compass.quadrants.find(
    (quadrant) => normalizeWhenExpression(quadrant.when) === normalizedExpected
  );

  const fallbackQuadrant = compass.quadrants[getQuadrantIndexFallback(x, y)];
  const selectedQuadrant = matchedQuadrant ?? fallbackQuadrant;

  if (!selectedQuadrant) {
    throw new Error(`Compass '${compass.id}' has invalid quadrant configuration.`);
  }

  return {
    compass,
    quadrant: selectedQuadrant,
    x,
    y
  };
}

export function calculateCompassResults(
  compasses: CompassDefinition[],
  scores: AxisScores
): CompassResult[] {
  return compasses.map((compass) => resolveCompassResult(compass, scores));
}

export function getOrderedQuestions(
  questions: Question[],
  compasses: CompassDefinition[]
): Question[] {
  const compassIndexById = new Map(compasses.map((compass, index) => [compass.id, index]));

  return questions
    .map((question, index) => ({
      question,
      originalIndex: index,
      compassIndex: compassIndexById.get(question.compassId) ?? Number.MAX_SAFE_INTEGER
    }))
    .sort((left, right) => {
      if (left.compassIndex === right.compassIndex) {
        return left.originalIndex - right.originalIndex;
      }

      return left.compassIndex - right.compassIndex;
    })
    .map((item) => item.question);
}

export function buildTypeCode(
  scores: AxisScores,
  axesOrder: TypeCodeAxis[] = [...TYPE_CODE_AXES_DEFAULT]
): string {
  return axesOrder
    .map((axis) => (scores[axis] > 0 ? POSITIVE_LETTER_BY_AXIS[axis] : NEGATIVE_LETTER_BY_AXIS[axis]))
    .join("");
}

function bitForAxisLetter(axis: keyof typeof BIT_AXIS_LETTERS, letter: string): 0 | 1 {
  if (letter === BIT_AXIS_LETTERS[axis].positive) {
    return 0;
  }

  if (letter === BIT_AXIS_LETTERS[axis].negative) {
    return 1;
  }

  throw new Error(`Invalid letter '${letter}' for axis '${axis}'.`);
}

export function resolveTypeTitle(typeCode: string, typeTitles: TypeTitlesData): TypeTitleResolution {
  if (typeCode.length < 6) {
    throw new Error("Type code must contain 6 letters.");
  }

  const familyKey = typeCode.slice(0, 2);
  const family = typeTitles.families[familyKey];

  if (!family) {
    throw new Error(`No title family found for key '${familyKey}'.`);
  }

  const kpLetter = typeCode[2];
  const rjLetter = typeCode[3];
  const scLetter = typeCode[4];
  const maLetter = typeCode[5];

  const index =
    bitForAxisLetter("KP", kpLetter) +
    2 * bitForAxisLetter("RJ", rjLetter) +
    4 * bitForAxisLetter("SC", scLetter) +
    8 * bitForAxisLetter("MA", maLetter);

  const title = family.titles16[index];
  if (!title) {
    throw new Error(`Type title missing at index ${index} for family '${familyKey}'.`);
  }

  return {
    familyKey,
    familyName: family.familyName,
    index,
    title
  };
}

export function isQuizComplete(questions: Question[], answers: AnswerMap): boolean {
  return questions.every((question) => typeof answers[question.id] === "string");
}
