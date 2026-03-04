import {
  type AxisScores,
  type GeneratedResult,
  type LoadedAppData,
  type QuadrantWriteup
} from "../types";
import { getObjectsForType } from "./objectGenerator";
import { buildTypeCode, calculateCompassResults, resolveTypeTitle } from "./scoring";

const MAX_STRENGTHS = 9;
const MAX_WATCHOUTS = 8;
const MAX_CELEBS = 10;
const MAX_CONFIDENCE_DISTANCE = 24;

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

function calculateConfidence(x: number, y: number): number {
  const normalized = (Math.abs(x) + Math.abs(y)) / MAX_CONFIDENCE_DISTANCE;
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

export function generateResult(data: LoadedAppData, scores: AxisScores): GeneratedResult {
  const compassResults = calculateCompassResults(data.compasses.compasses, scores);

  const typeCode = buildTypeCode(scores, data.compasses.typeCodeAxes);
  const typeTitle = resolveTypeTitle(typeCode, data.typeTitles);

  const breakdown = compassResults.map((result) => {
    const writeupKey = `${result.compass.id}.${result.quadrant.id}`;
    const writeup = data.quadrantWriteups.quadrantWriteups[writeupKey];

    if (!writeup) {
      throw new Error(`Missing quadrant writeup for '${writeupKey}'.`);
    }

    return {
      ...result,
      confidence: calculateConfidence(result.x, result.y),
      writeup
    };
  });

  const powerResult = breakdown.find((item) => item.compass.id === "power") ?? breakdown[0];
  if (!powerResult) {
    throw new Error("No compass results available.");
  }

  const orderResult = breakdown.find((item) => item.compass.id === "order") ?? breakdown[1];
  const riskResult = breakdown.find((item) => item.compass.id === "risk");

  const mergedStrengths = dedupeAndCap(
    breakdown.flatMap((item) => item.writeup.strengths),
    MAX_STRENGTHS
  );
  const mergedWatchouts = dedupeAndCap(
    breakdown.flatMap((item) => item.writeup.pitfalls),
    MAX_WATCHOUTS
  );
  const mergedCelebs = dedupeAndCap(
    breakdown.flatMap((item) => item.writeup.celebs),
    MAX_CELEBS
  );

  const templateValues = {
    TITLE: typeTitle.title,
    TYPE_CODE: typeCode,
    POWER_LABEL: powerResult.quadrant.label,
    ORDER_LABEL: orderResult?.quadrant.label ?? "Unknown Order Alignment",
    STRENGTHS_BULLETS: mergedStrengths.join(", "),
    PITFALLS_BULLETS: mergedWatchouts.join(", "),
    CELEBS_LIST: mergedCelebs.join(", ")
  };

  const introTemplate = getTemplateSectionFormat(data, "intro");
  const summary = introTemplate
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
      householdArchetypeMessage = "Object data is available, but this type could not map to objects.";
    }
  }

  return {
    archetypeTitle: typeTitle.title,
    typeCode,
    titleIndex: typeTitle.index,
    typeFamilyKey: typeTitle.familyKey,
    typeFamilyName: typeTitle.familyName,
    summary,
    powerOneLiner: powerResult.writeup.oneLiner,
    strengths: mergedStrengths,
    watchouts: mergedWatchouts,
    celebs: mergedCelebs,
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
