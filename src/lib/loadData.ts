import {
  AXIS_KEYS,
  BIT_ORDER_AXES_DEFAULT,
  DEFAULT_RESULTS_CONTENT,
  type AxisDefinitions,
  type AxisKey,
  type CompassDefinition,
  type CompassesData,
  type LoadedAppData,
  type ObjectAxisPoolKey,
  type ObjectsData,
  type Question,
  type QuadrantWriteup,
  type QuadrantWriteupsData,
  type ResultsContentData,
  type TemplateSection,
  type TypeWriteupEntry,
  type TypeFamilyKey,
  type TypeTitlesData,
  type TypeCodeAxis,
  isAxisKey,
  isBitOrderAxis,
  isTypeCodeAxis
} from "../types";

type JsonRecord = Record<string, unknown>;

export class DataLoadError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "DataLoadError";
    if (options && "cause" in options) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

let dataCachePromise: Promise<LoadedAppData> | null = null;

const REQUIRED_DATA_FILES = {
  compasses: "compasses.json",
  questions: "questions.json",
  typeTitles: "type-titles.json",
  quadrantWriteups: "quadrant_writeups.json"
} as const;

const OPTIONAL_DATA_FILES = {
  resultsContent: "results-content.json",
  objects: "objects.json"
} as const;

const OBJECT_FAMILY_KEYS: TypeFamilyKey[] = ["VH", "WH", "VG", "WG"];
const OBJECT_AXIS_POOL_KEYS: ObjectAxisPoolKey[] = [
  "KP",
  "PJ",
  "RJ",
  "JJ",
  "SC",
  "CC",
  "MA",
  "AA"
];

const EXPECTED_COMPASS_COUNT = 5;
const EXPECTED_QUESTIONS_PER_COMPASS = 10;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ensureRecord(value: unknown, label: string): JsonRecord {
  if (!isRecord(value)) {
    throw new DataLoadError(`${label} must be an object.`);
  }
  return value;
}

function ensureArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new DataLoadError(`${label} must be an array.`);
  }
  return value;
}

function ensureString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new DataLoadError(`${label} must be a non-empty string.`);
  }
  return value;
}

function ensureNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new DataLoadError(`${label} must be a valid number.`);
  }
  return value;
}

function getDataUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}data/${fileName}`;
}

async function fetchJsonFile<T>(fileName: string, optional = false): Promise<T | null> {
  const url = getDataUrl(fileName);
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new DataLoadError(`Could not fetch ${fileName}.`, { cause: error });
  }

  if (!response.ok) {
    if (optional && response.status === 404) {
      return null;
    }

    throw new DataLoadError(
      `Failed to load ${fileName} (${response.status} ${response.statusText}).`
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    if (optional) {
      return null;
    }
    throw new DataLoadError(`${fileName} is not valid JSON.`, { cause: error });
  }
}

function parseCompassesData(raw: unknown): CompassesData {
  const root = ensureRecord(raw, "compasses.json");
  const axesRaw = ensureRecord(root.axes, "compasses.json axes");
  const compassesRaw = ensureArray(root.compasses, "compasses.json compasses");
  const typeCodeAxesRaw = ensureArray(root.typeCodeAxes, "compasses.json typeCodeAxes");

  const axes = {} as AxisDefinitions;
  for (const axis of AXIS_KEYS) {
    const axisObj = ensureRecord(axesRaw[axis], `Axis definition for ${axis}`);
    axes[axis] = {
      posLabel: ensureString(axisObj.posLabel, `${axis} posLabel`),
      negLabel: ensureString(axisObj.negLabel, `${axis} negLabel`)
    };
  }

  const compasses: CompassDefinition[] = compassesRaw.map((item, index) => {
    const compassObj = ensureRecord(item, `Compass #${index + 1}`);
    const id = ensureString(compassObj.id, `Compass #${index + 1} id`);
    const name = ensureString(compassObj.name, `Compass ${id} name`);
    const xAxisRaw = ensureString(compassObj.xAxis, `Compass ${id} xAxis`);
    const yAxisRaw = ensureString(compassObj.yAxis, `Compass ${id} yAxis`);

    if (!isAxisKey(xAxisRaw) || !isAxisKey(yAxisRaw)) {
      throw new DataLoadError(`Compass ${id} has invalid axis keys.`);
    }

    const quadrantsRaw = ensureArray(compassObj.quadrants, `Compass ${id} quadrants`);
    if (quadrantsRaw.length !== 4) {
      throw new DataLoadError(`Compass ${id} must define exactly 4 quadrants.`);
    }

    return {
      id,
      name,
      xAxis: xAxisRaw,
      yAxis: yAxisRaw,
      quadrants: quadrantsRaw.map((quadrantItem, quadrantIndex) => {
        const quadrantObj = ensureRecord(
          quadrantItem,
          `Compass ${id} quadrant #${quadrantIndex + 1}`
        );

        return {
          id: ensureString(
            quadrantObj.id,
            `Compass ${id} quadrant #${quadrantIndex + 1} id`
          ),
          when: ensureString(
            quadrantObj.when,
            `Compass ${id} quadrant #${quadrantIndex + 1} when`
          ),
          label: ensureString(
            quadrantObj.label,
            `Compass ${id} quadrant #${quadrantIndex + 1} label`
          )
        };
      })
    };
  });

  const typeCodeAxes: TypeCodeAxis[] = typeCodeAxesRaw.map((axis, index) => {
    const axisRaw = ensureString(axis, `typeCodeAxes[${index}]`);
    if (!isTypeCodeAxis(axisRaw)) {
      throw new DataLoadError(`typeCodeAxes[${index}] must be one of VW, HG, KP, RJ, SC, MA.`);
    }
    return axisRaw;
  });

  if (typeCodeAxes.length !== 6) {
    throw new DataLoadError("typeCodeAxes must contain exactly 6 axes.");
  }

  return {
    axes,
    compasses,
    typeCodeAxes
  };
}

function parseQuestions(raw: unknown): Question[] {
  const questionList = ensureArray(raw, "questions.json");

  return questionList.map((item, index) => {
    const questionObj = ensureRecord(item, `Question #${index + 1}`);
    const id = ensureString(questionObj.id, `Question #${index + 1} id`);
    const compassId = ensureString(questionObj.compassId, `Question ${id} compassId`);
    const prompt = ensureString(questionObj.prompt, `Question ${id} prompt`);
    const answersRaw = ensureArray(questionObj.answers, `Question ${id} answers`);

    if (answersRaw.length !== 4) {
      throw new DataLoadError(`Question ${id} must have exactly 4 answers.`);
    }

    const answers = answersRaw.map((answerItem, answerIndex) => {
      const answerObj = ensureRecord(answerItem, `Question ${id} answer #${answerIndex + 1}`);
      const deltaRaw = ensureRecord(
        answerObj.delta,
        `Question ${id} answer ${answerIndex + 1} delta`
      );

      const delta: Partial<Record<AxisKey, number>> = {};
      for (const [axisKeyRaw, deltaValueRaw] of Object.entries(deltaRaw)) {
        if (!isAxisKey(axisKeyRaw)) {
          throw new DataLoadError(`Question ${id} has invalid axis in delta: ${axisKeyRaw}`);
        }
        delta[axisKeyRaw] = ensureNumber(
          deltaValueRaw,
          `Question ${id} delta for ${axisKeyRaw}`
        );
      }

      return {
        id: ensureString(answerObj.id, `Question ${id} answer ${answerIndex + 1} id`),
        text: ensureString(answerObj.text, `Question ${id} answer ${answerIndex + 1} text`),
        delta
      };
    });

    return {
      id,
      compassId,
      prompt,
      answers
    };
  });
}

function parseTypeTitles(raw: unknown): TypeTitlesData {
  const root = ensureRecord(raw, "type-titles.json");
  const familiesRaw = ensureRecord(root.families, "type-titles.json families");

  const families: TypeTitlesData["families"] = {};
  for (const [familyKey, value] of Object.entries(familiesRaw)) {
    const familyObj = ensureRecord(value, `type-titles family ${familyKey}`);
    const titlesRaw = ensureArray(familyObj.titles16, `${familyKey} titles16`);

    const titles16 = titlesRaw.map((titleItem, index) =>
      ensureString(titleItem, `${familyKey} titles16[${index}]`)
    );

    if (titles16.length !== 16) {
      throw new DataLoadError(`Family ${familyKey} must define exactly 16 titles.`);
    }

    families[familyKey] = {
      familyName: ensureString(familyObj.familyName, `${familyKey} familyName`),
      titles16
    };
  }

  const bitOrderRaw = ensureArray(root.bitOrder, "type-titles bitOrder");
  const bitOrder = bitOrderRaw.map((axis, index) => {
    const axisRaw = ensureString(axis, `bitOrder[${index}]`);
    if (!isBitOrderAxis(axisRaw)) {
      throw new DataLoadError(`bitOrder[${index}] must be one of KP, RJ, SC, MA.`);
    }
    return axisRaw;
  });

  if (bitOrder.length !== 4) {
    throw new DataLoadError("bitOrder must contain exactly 4 axes.");
  }

  const bitMeaningRaw = ensureRecord(root.bitMeaning, "type-titles bitMeaning");
  const bitMeaning = {} as TypeTitlesData["bitMeaning"];

  for (const axis of BIT_ORDER_AXES_DEFAULT) {
    const axisMeaningRaw = ensureRecord(bitMeaningRaw[axis], `bitMeaning for ${axis}`);
    bitMeaning[axis] = {
      "0": ensureString(axisMeaningRaw["0"], `${axis} bitMeaning[0]`),
      "1": ensureString(axisMeaningRaw["1"], `${axis} bitMeaning[1]`)
    };
  }

  return {
    families,
    bitOrder,
    bitMeaning
  };
}

function parseQuadrantWriteup(raw: unknown, label: string): QuadrantWriteup {
  const writeupObj = ensureRecord(raw, label);

  const readStringArray = (value: unknown, fieldLabel: string): string[] => {
    const arr = ensureArray(value, fieldLabel);
    return arr.map((item, index) => ensureString(item, `${fieldLabel}[${index}]`));
  };

  return {
    headline: ensureString(writeupObj.headline, `${label} headline`),
    strengths: readStringArray(writeupObj.strengths, `${label} strengths`),
    pitfalls: readStringArray(writeupObj.pitfalls, `${label} pitfalls`),
    oneLiner: ensureString(writeupObj.oneLiner, `${label} oneLiner`),
    celebs: readStringArray(writeupObj.celebs, `${label} celebs`)
  };
}

function parseQuadrantWriteups(raw: unknown): QuadrantWriteupsData {
  const root = ensureRecord(raw, "quadrant_writeups.json");
  const writeupsRaw = ensureRecord(root.quadrantWriteups, "quadrantWriteups");

  const quadrantWriteups: Record<string, QuadrantWriteup> = {};
  for (const [key, value] of Object.entries(writeupsRaw)) {
    quadrantWriteups[key] = parseQuadrantWriteup(value, `quadrantWriteups.${key}`);
  }

  return {
    quadrantWriteups
  };
}

function parseTemplateSections(raw: unknown): TemplateSection[] | undefined {
  if (!isRecord(raw) || !Array.isArray(raw.sections)) {
    return undefined;
  }

  const sections: TemplateSection[] = [];
  for (let index = 0; index < raw.sections.length; index += 1) {
    const section = raw.sections[index];
    if (!isRecord(section)) {
      continue;
    }

    const id = section.id;
    const format = section.format;
    if (typeof id === "string" && id && typeof format === "string" && format) {
      sections.push({ id, format });
    }
  }

  return sections.length > 0 ? sections : undefined;
}

function parseNonEmptyStringArray(value: unknown, label: string): string[] {
  const arr = ensureArray(value, label);
  const parsed = arr.map((item, index) => ensureString(item, `${label}[${index}]`));
  if (parsed.length === 0) {
    throw new DataLoadError(`${label} must contain at least one string value.`);
  }
  return parsed;
}

function parseObjectsData(raw: unknown): ObjectsData {
  const root = ensureRecord(raw, "objects.json");
  const objectInventory = parseNonEmptyStringArray(root.objectInventory, "objects.json objectInventory");

  const uniqueInventory = new Set(objectInventory.map((item) => item.trim().toLowerCase()));
  if (objectInventory.length !== 64 || uniqueInventory.size !== 64) {
    throw new DataLoadError("objects.json objectInventory must contain exactly 64 unique objects.");
  }

  let primaryObjectPools: ObjectsData["primaryObjectPools"] = undefined;
  if (isRecord(root.primaryObjectPools)) {
    primaryObjectPools = {} as NonNullable<ObjectsData["primaryObjectPools"]>;
    for (const key of OBJECT_FAMILY_KEYS) {
      primaryObjectPools[key] = parseNonEmptyStringArray(
        root.primaryObjectPools[key],
        `objects.json primaryObjectPools.${key}`
      );
    }
  }

  let backupObjectPools: ObjectsData["backupObjectPools"] = undefined;
  const backupPoolsRaw = isRecord(root.backupObjectPools)
    ? root.backupObjectPools
    : isRecord(root.axisObjectPools)
      ? root.axisObjectPools
      : null;
  if (backupPoolsRaw) {
    backupObjectPools = {} as NonNullable<ObjectsData["backupObjectPools"]>;
    for (const key of OBJECT_AXIS_POOL_KEYS) {
      backupObjectPools[key] = parseNonEmptyStringArray(
        backupPoolsRaw[key],
        `objects.json backupObjectPools.${key}`
      );
    }
  }

  let objectsByTypeCode: ObjectsData["objectsByTypeCode"] = undefined;
  if (isRecord(root.objectsByTypeCode)) {
    const objectsByTypeCodeRaw = root.objectsByTypeCode;
    objectsByTypeCode = {};
    for (const [typeCode, pairRaw] of Object.entries(objectsByTypeCodeRaw)) {
      const pair = ensureRecord(pairRaw, `objectsByTypeCode.${typeCode}`);
      const primaryValue =
        typeof pair.primaryObject === "string" && pair.primaryObject.trim()
          ? pair.primaryObject
          : pair.primary;
      const backupValue =
        typeof pair.backupObject === "string" && pair.backupObject.trim()
          ? pair.backupObject
          : pair.backup;
      const parsedBackup =
        typeof backupValue === "string" && backupValue.trim()
          ? ensureString(
              backupValue,
              `objectsByTypeCode.${typeCode}.backupObject (or backup)`
            )
          : undefined;
      objectsByTypeCode[typeCode] = {
        primary: ensureString(
          primaryValue,
          `objectsByTypeCode.${typeCode}.primaryObject (or primary)`
        ),
        backup: parsedBackup,
        primaryReason:
          typeof pair.primaryReason === "string" && pair.primaryReason.trim()
            ? pair.primaryReason
            : undefined,
        backupReason:
          typeof pair.backupReason === "string" && pair.backupReason.trim()
            ? pair.backupReason
            : undefined
      };
    }
  }

  return {
    objectInventory,
    primaryObjectPools,
    backupObjectPools,
    objectsByTypeCode
  };
}

function parseTypeWriteupEntry(raw: unknown, label: string): TypeWriteupEntry {
  const writeupObj = ensureRecord(raw, label);

  const readStringArray = (value: unknown, fieldLabel: string): string[] => {
    const arr = ensureArray(value, fieldLabel);
    return arr.map((item, index) => ensureString(item, `${fieldLabel}[${index}]`));
  };

  const entry: TypeWriteupEntry = {
    title: ensureString(writeupObj.title, `${label}.title`),
    headline: ensureString(writeupObj.headline, `${label}.headline`),
    strengths: readStringArray(writeupObj.strengths, `${label}.strengths`),
    pitfalls: readStringArray(writeupObj.pitfalls, `${label}.pitfalls`),
    oneLiner: ensureString(writeupObj.oneLiner, `${label}.oneLiner`),
    celebs: readStringArray(writeupObj.celebs, `${label}.celebs`)
  };

  if (typeof writeupObj.primaryObject === "string" && writeupObj.primaryObject.trim()) {
    entry.primaryObject = writeupObj.primaryObject;
  }

  if (typeof writeupObj.backupObject === "string" && writeupObj.backupObject.trim()) {
    entry.backupObject = writeupObj.backupObject;
  }

  return entry;
}

function parseResultsContent(raw: unknown): ResultsContentData {
  if (!isRecord(raw)) {
    return DEFAULT_RESULTS_CONTENT;
  }

  const disclaimer =
    typeof raw.disclaimer === "string" && raw.disclaimer.trim().length > 0
      ? raw.disclaimer
      : DEFAULT_RESULTS_CONTENT.disclaimer;

  const landingTitle =
    typeof raw.landingTitle === "string" && raw.landingTitle.trim().length > 0
      ? raw.landingTitle
      : DEFAULT_RESULTS_CONTENT.landingTitle;

  const landingSubtitle =
    typeof raw.landingSubtitle === "string" && raw.landingSubtitle.trim().length > 0
      ? raw.landingSubtitle
      : DEFAULT_RESULTS_CONTENT.landingSubtitle;

  const startButtonLabel =
    typeof raw.startButtonLabel === "string" && raw.startButtonLabel.trim().length > 0
      ? raw.startButtonLabel
      : DEFAULT_RESULTS_CONTENT.startButtonLabel;

  const restartButtonLabel =
    typeof raw.restartButtonLabel === "string" && raw.restartButtonLabel.trim().length > 0
      ? raw.restartButtonLabel
      : DEFAULT_RESULTS_CONTENT.restartButtonLabel;

  const resultsHeading =
    typeof raw.resultsHeading === "string" && raw.resultsHeading.trim().length > 0
      ? raw.resultsHeading
      : DEFAULT_RESULTS_CONTENT.resultsHeading;

  const templateSections = parseTemplateSections(raw.typeWriteupTemplate);
  const celebsNote =
    typeof raw.celebsNote === "string" && raw.celebsNote.trim().length > 0
      ? raw.celebsNote
      : undefined;

  let typeWriteups: ResultsContentData["typeWriteups"] = undefined;
  if (isRecord(raw.typeWriteups)) {
    typeWriteups = {};
    for (const [typeCode, entryRaw] of Object.entries(raw.typeWriteups)) {
      typeWriteups[typeCode] = parseTypeWriteupEntry(entryRaw, `typeWriteups.${typeCode}`);
    }
  }

  return {
    disclaimer,
    landingTitle,
    landingSubtitle,
    startButtonLabel,
    restartButtonLabel,
    resultsHeading,
    celebsNote,
    typeWriteups,
    typeWriteupTemplate: templateSections ? { sections: templateSections } : undefined
  };
}

function validateDataRelationships(
  compasses: CompassesData,
  questions: Question[],
  typeTitles: TypeTitlesData,
  quadrantWriteups: QuadrantWriteupsData
): void {
  if (compasses.compasses.length !== EXPECTED_COMPASS_COUNT) {
    throw new DataLoadError(`Expected exactly ${EXPECTED_COMPASS_COUNT} compasses.`);
  }

  const compassIds = new Set(compasses.compasses.map((compass) => compass.id));
  for (const question of questions) {
    if (!compassIds.has(question.compassId)) {
      throw new DataLoadError(`Question ${question.id} references unknown compass '${question.compassId}'.`);
    }
  }

  const expectedTotalQuestions = compasses.compasses.length * EXPECTED_QUESTIONS_PER_COMPASS;
  if (questions.length !== expectedTotalQuestions) {
    throw new DataLoadError(
      `Expected ${expectedTotalQuestions} questions (${EXPECTED_QUESTIONS_PER_COMPASS} per compass), found ${questions.length}.`
    );
  }

  for (const compass of compasses.compasses) {
    const questionCount = questions.filter((question) => question.compassId === compass.id).length;
    if (questionCount !== EXPECTED_QUESTIONS_PER_COMPASS) {
      throw new DataLoadError(
        `Compass '${compass.id}' must have exactly ${EXPECTED_QUESTIONS_PER_COMPASS} questions (found ${questionCount}).`
      );
    }

    for (const quadrant of compass.quadrants) {
      const key = `${compass.id}.${quadrant.id}`;
      if (!quadrantWriteups.quadrantWriteups[key]) {
        throw new DataLoadError(`Missing writeup for quadrant '${key}'.`);
      }
    }
  }

  const requiredFamilies = ["VH", "WH", "VG", "WG"];
  for (const family of requiredFamilies) {
    if (!typeTitles.families[family]) {
      throw new DataLoadError(`Missing type title family '${family}'.`);
    }
  }
}

async function loadAndValidateData(): Promise<LoadedAppData> {
  const [compassesRaw, questionsRaw, typeTitlesRaw, quadrantWriteupsRaw] = await Promise.all([
    fetchJsonFile(REQUIRED_DATA_FILES.compasses),
    fetchJsonFile(REQUIRED_DATA_FILES.questions),
    fetchJsonFile(REQUIRED_DATA_FILES.typeTitles),
    fetchJsonFile(REQUIRED_DATA_FILES.quadrantWriteups)
  ]);

  const compasses = parseCompassesData(compassesRaw);
  const questions = parseQuestions(questionsRaw);
  const typeTitles = parseTypeTitles(typeTitlesRaw);
  const quadrantWriteups = parseQuadrantWriteups(quadrantWriteupsRaw);

  let optionalResultsRaw: unknown = null;
  try {
    optionalResultsRaw = await fetchJsonFile(OPTIONAL_DATA_FILES.resultsContent, true);
  } catch {
    optionalResultsRaw = null;
  }

  const resultsContent = parseResultsContent(optionalResultsRaw);
  let objectsData: ObjectsData | null = null;
  let objectsDataWarning: string | null = null;

  try {
    const optionalObjectsRaw = await fetchJsonFile(OPTIONAL_DATA_FILES.objects, true);
    if (optionalObjectsRaw) {
      objectsData = parseObjectsData(optionalObjectsRaw);
    } else {
      objectsDataWarning =
        "Dude, the everyday object vault is totally missing right now, so no object match this run.";
    }
  } catch {
    objectsDataWarning =
      "Most unexcellent news: the object data is scrambled, so we hid object results to keep the vibes stable.";
    objectsData = null;
  }

  validateDataRelationships(compasses, questions, typeTitles, quadrantWriteups);

  return {
    compasses,
    questions,
    typeTitles,
    quadrantWriteups,
    resultsContent,
    objectsData,
    objectsDataWarning
  };
}

export function clearDataCache(): void {
  dataCachePromise = null;
}

export function loadAppData(forceReload = false): Promise<LoadedAppData> {
  if (forceReload || !dataCachePromise) {
    dataCachePromise = loadAndValidateData().catch((error) => {
      dataCachePromise = null;
      throw error;
    });
  }

  return dataCachePromise;
}
