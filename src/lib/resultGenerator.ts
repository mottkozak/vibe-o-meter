import {
  type AxisKey,
  type AxisScores,
  type GeneratedResult,
  type LoadedAppData,
  type Question,
  type QuadrantWriteup
} from "../types";
import { getObjectsForType } from "./objectGenerator";
import { buildTypeCode, calculateCompassResults, resolveTypeTitle } from "./scoring";

const MAX_STRENGTHS = 9;
const MAX_WATCHOUTS = 8;
const MAX_CELEBS = 10;
const DEFAULT_MAX_CONFIDENCE_DISTANCE = 24;

function dedupeAndCap(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const rawItem of items) {
    const normalized = rawItem.trim();
    if (!normalized) {
      continue;
    }

    const dedupeKey = normalized.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    output.push(normalized);

    if (output.length >= limit) {
      break;
    }
  }

  return output;
}

function calculateConfidence(x: number, y: number, maxDistance: number): number {
  const normalized = (Math.abs(x) + Math.abs(y)) / maxDistance;
  return Math.max(0, Math.min(100, Math.round(normalized * 100)));
}

function interpolateTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{([A-Z_]+)\}/g, (_, key: string) => values[key] ?? "");
}

function getTemplateSectionFormat(
  data: LoadedAppData,
  sectionId: string
): string | undefined {
  const sections = data.resultsContent.typeWriteupTemplate?.sections;
  if (!sections) {
    return undefined;
  }

  return sections.find((section) => section.id === sectionId)?.format;
}

function toSentenceClause(value: string, fallback: string): string {
  const cleaned = value.trim().replace(/[.!?]+$/g, "");
  if (!cleaned) {
    return fallback;
  }

  const lowerFirst = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  if (lowerFirst.startsWith("you ")) {
    return lowerFirst;
  }

  return `you ${lowerFirst}`;
}

function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*/g, "");
}

function calculateAxisMaxForQuestion(question: Question, axis: AxisKey): number {
  return question.answers.reduce((maxAbs, answer) => {
    const delta = answer.delta[axis];
    if (typeof delta !== "number") {
      return maxAbs;
    }
    return Math.max(maxAbs, Math.abs(delta));
  }, 0);
}

function buildCompassMaxDistanceMap(data: LoadedAppData): Record<string, number> {
  const byCompassId = new Map<string, Question[]>();
  for (const question of data.questions) {
    const bucket = byCompassId.get(question.compassId) ?? [];
    bucket.push(question);
    byCompassId.set(question.compassId, bucket);
  }

  const result: Record<string, number> = {};
  for (const compass of data.compasses.compasses) {
    const questionsForCompass = byCompassId.get(compass.id) ?? [];
    const maxX = questionsForCompass.reduce((sum, question) => {
      return sum + calculateAxisMaxForQuestion(question, compass.xAxis);
    }, 0);
    const maxY = questionsForCompass.reduce((sum, question) => {
      return sum + calculateAxisMaxForQuestion(question, compass.yAxis);
    }, 0);
    const maxDistance = maxX + maxY;
    result[compass.id] = maxDistance > 0 ? maxDistance : DEFAULT_MAX_CONFIDENCE_DISTANCE;
  }

  return result;
}

export function generateResult(data: LoadedAppData, scores: AxisScores): GeneratedResult {
  const compassResults = calculateCompassResults(data.compasses.compasses, scores);
  const maxDistanceByCompass = buildCompassMaxDistanceMap(data);

  const typeCode = buildTypeCode(scores, data.compasses.typeCodeAxes);
  const typeTitle = resolveTypeTitle(typeCode, data.typeTitles);
  const typeWriteup = data.resultsContent.typeWriteups?.[typeCode];

  const breakdown = compassResults.map((result) => {
    const writeupKey = `${result.compass.id}.${result.quadrant.id}`;
    const writeup = data.quadrantWriteups.quadrantWriteups[writeupKey];

    if (!writeup) {
      throw new Error(`Missing quadrant writeup for '${writeupKey}'.`);
    }

    const maxDistance = maxDistanceByCompass[result.compass.id] ?? DEFAULT_MAX_CONFIDENCE_DISTANCE;

    return {
      ...result,
      confidence: calculateConfidence(result.x, result.y, maxDistance),
      writeup
    };
  });

  const powerResult = breakdown.find((item) => item.compass.id === "power") ?? breakdown[0];
  if (!powerResult) {
    throw new Error("No compass results available.");
  }

  const orderResult = breakdown.find((item) => item.compass.id === "order") ?? breakdown[1];
  const riskResult = breakdown.find((item) => item.compass.id === "risk");

  const mergedStrengthsFromQuadrants = dedupeAndCap(
    breakdown.flatMap((item) => item.writeup.strengths),
    MAX_STRENGTHS
  );
  const mergedWatchoutsFromQuadrants = dedupeAndCap(
    breakdown.flatMap((item) => item.writeup.pitfalls),
    MAX_WATCHOUTS
  );
  const mergedCelebsFromQuadrants = dedupeAndCap(
    breakdown.flatMap((item) => item.writeup.celebs),
    MAX_CELEBS
  );

  const strengths = typeWriteup
    ? dedupeAndCap(typeWriteup.strengths, MAX_STRENGTHS)
    : mergedStrengthsFromQuadrants;
  const watchouts = typeWriteup
    ? dedupeAndCap(typeWriteup.pitfalls, MAX_WATCHOUTS)
    : mergedWatchoutsFromQuadrants;
  const celebs = typeWriteup
    ? dedupeAndCap(typeWriteup.celebs, MAX_CELEBS)
    : mergedCelebsFromQuadrants;

  const templateValues = {
    TITLE: typeWriteup?.title ?? typeTitle.title,
    TYPE_CODE: typeCode,
    POWER_LABEL: powerResult.quadrant.label,
    ORDER_LABEL: orderResult?.quadrant.label ?? "Unknown Order Alignment",
    STRENGTHS_BULLETS: strengths.join(", "),
    PITFALLS_BULLETS: watchouts.join(", "),
    CELEBS_LIST: celebs.join(", ")
  };

  const introTemplate = getTemplateSectionFormat(data, "intro");
  const summary = typeWriteup?.headline
    ? stripMarkdownBold(typeWriteup.headline)
    : introTemplate
      ? interpolateTemplate(introTemplate, templateValues)
      : `${powerResult.writeup.headline} Across your full profile, your Order style lands as ${templateValues.ORDER_LABEL}.`;

  let householdArchetype: GeneratedResult["householdArchetype"] = null;
  let householdArchetypeMessage: string | null = data.objectsDataWarning;

  if (data.objectsData) {
    try {
      const objects = getObjectsForType(typeCode, typeTitle.index, data.objectsData);
      const primaryWhy = toSentenceClause(
        powerResult.writeup.strengths[0] ?? powerResult.writeup.headline,
        "you are steady and supportive"
      );
      const backupWhy = toSentenceClause(
        riskResult?.writeup.strengths[0] ??
          orderResult?.writeup.strengths[0] ??
          "you improvise solutions when things get messy",
        "you improvise solutions when things get messy"
      );

      householdArchetype = {
        primaryObject: objects.primaryObject,
        backupObject: objects.backupObject,
        why: `Primary Object: ${objects.primaryObject} — ${primaryWhy}. Backup Object: ${objects.backupObject} — ${backupWhy}.`
      };
      householdArchetypeMessage = null;
    } catch {
      householdArchetype = null;
      householdArchetypeMessage =
        "Dude, the object mapper got totally confused by your type, so this section is taking a snack break.";
    }
  } else if (typeWriteup?.primaryObject && typeWriteup?.backupObject) {
    const primaryWhy = toSentenceClause(
      powerResult.writeup.strengths[0] ?? powerResult.writeup.headline,
      "you are steady and supportive"
    );
    const backupWhy = toSentenceClause(
      riskResult?.writeup.strengths[0] ??
        orderResult?.writeup.strengths[0] ??
        "you improvise solutions when things get messy",
      "you improvise solutions when things get messy"
    );
    householdArchetype = {
      primaryObject: typeWriteup.primaryObject,
      backupObject: typeWriteup.backupObject,
      why: `Primary Object: ${typeWriteup.primaryObject} — ${primaryWhy}. Backup Object: ${typeWriteup.backupObject} — ${backupWhy}.`
    };
    householdArchetypeMessage = null;
  }

  return {
    archetypeTitle: typeWriteup?.title ?? typeTitle.title,
    typeCode,
    titleIndex: typeTitle.index,
    typeFamilyKey: typeTitle.familyKey,
    typeFamilyName: typeTitle.familyName,
    summary,
    powerOneLiner: typeWriteup?.oneLiner ?? powerResult.writeup.oneLiner,
    strengths,
    watchouts,
    celebs,
    celebsNote: data.resultsContent.celebsNote,
    householdArchetype,
    householdArchetypeMessage,
    compassBreakdown: breakdown,
    disclaimer: data.resultsContent.disclaimer
  };
}

export function mergeWriteupsPreview(writeups: QuadrantWriteup[]): {
  strengths: string[];
  watchouts: string[];
  celebs: string[];
} {
  return {
    strengths: dedupeAndCap(
      writeups.flatMap((writeup) => writeup.strengths),
      MAX_STRENGTHS
    ),
    watchouts: dedupeAndCap(
      writeups.flatMap((writeup) => writeup.pitfalls),
      MAX_WATCHOUTS
    ),
    celebs: dedupeAndCap(
      writeups.flatMap((writeup) => writeup.celebs),
      MAX_CELEBS
    )
  };
}
