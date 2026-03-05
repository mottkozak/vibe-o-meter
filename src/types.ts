export const AXIS_KEYS = [
  "VW",
  "HG",
  "KP",
  "RJ",
  "SC",
  "ST",
  "PT",
  "QR",
  "GP",
  "MA"
] as const;

export const TYPE_CODE_AXES_DEFAULT = ["VW", "HG", "KP", "RJ", "SC", "MA"] as const;
export const BIT_ORDER_AXES_DEFAULT = ["KP", "RJ", "SC", "MA"] as const;

export type AxisKey = (typeof AXIS_KEYS)[number];
export type TypeCodeAxis = (typeof TYPE_CODE_AXES_DEFAULT)[number];
export type BitOrderAxis = (typeof BIT_ORDER_AXES_DEFAULT)[number];

export type AxisScores = Record<AxisKey, number>;
export type AnswerMap = Record<string, string>;

export interface AxisDefinition {
  posLabel: string;
  negLabel: string;
}

export type AxisDefinitions = Record<AxisKey, AxisDefinition>;

export interface CompassQuadrantDefinition {
  id: string;
  when: string;
  label: string;
}

export interface CompassDefinition {
  id: string;
  name: string;
  xAxis: AxisKey;
  yAxis: AxisKey;
  quadrants: CompassQuadrantDefinition[];
}

export interface CompassesData {
  axes: AxisDefinitions;
  compasses: CompassDefinition[];
  typeCodeAxes: TypeCodeAxis[];
}

export interface AnswerOption {
  id: string;
  text: string;
  delta: Partial<Record<AxisKey, number>>;
}

export interface Question {
  id: string;
  compassId: string;
  prompt: string;
  answers: AnswerOption[];
}

export interface TypeTitleFamily {
  familyName: string;
  titles16: string[];
}

export interface TypeTitlesData {
  families: Record<string, TypeTitleFamily>;
  bitOrder: BitOrderAxis[];
  bitMeaning: Record<BitOrderAxis, Record<string, string>>;
}

export interface QuadrantWriteup {
  headline: string;
  strengths: string[];
  pitfalls: string[];
  oneLiner: string;
  celebs: string[];
}

export interface QuadrantWriteupsData {
  quadrantWriteups: Record<string, QuadrantWriteup>;
}

export interface TemplateSection {
  id: string;
  format: string;
}

export interface TypeWriteupEntry {
  title: string;
  headline: string;
  strengths: string[];
  pitfalls: string[];
  oneLiner: string;
  celebs: string[];
  primaryObject?: string;
  backupObject?: string;
}

export interface ResultsContentData {
  disclaimer: string;
  landingTitle: string;
  landingSubtitle: string;
  startButtonLabel: string;
  restartButtonLabel: string;
  resultsHeading: string;
  celebsNote?: string;
  typeWriteups?: Record<string, TypeWriteupEntry>;
  typeWriteupTemplate?: {
    sections: TemplateSection[];
  };
}

export type TypeFamilyKey = "VH" | "WH" | "VG" | "WG";
export type ObjectAxisPoolKey = "KP" | "PJ" | "RJ" | "JJ" | "SC" | "CC" | "MA" | "AA";

export interface ObjectsData {
  objectsByTypeCode?: Record<
    string,
    {
      primary: string;
      backup: string;
    }
  >;
  primaryObjectPools: Record<TypeFamilyKey, string[]>;
  backupObjectPools: Record<ObjectAxisPoolKey, string[]>;
}

export interface LoadedAppData {
  compasses: CompassesData;
  questions: Question[];
  typeTitles: TypeTitlesData;
  quadrantWriteups: QuadrantWriteupsData;
  resultsContent: ResultsContentData;
  objectsData: ObjectsData | null;
  objectsDataWarning: string | null;
}

export interface CompassResult {
  compass: CompassDefinition;
  quadrant: CompassQuadrantDefinition;
  x: number;
  y: number;
}

export interface TypeTitleResolution {
  familyKey: string;
  familyName: string;
  index: number;
  title: string;
}

export interface HouseholdArchetype {
  primaryObject: string;
  backupObject: string;
  why: string;
}

export interface GeneratedResult {
  archetypeTitle: string;
  typeCode: string;
  titleIndex: number;
  typeFamilyKey: string;
  typeFamilyName: string;
  summary: string;
  powerOneLiner: string;
  strengths: string[];
  watchouts: string[];
  celebs: string[];
  celebsNote?: string;
  householdArchetype: HouseholdArchetype | null;
  householdArchetypeMessage: string | null;
  compassBreakdown: Array<
    CompassResult & {
      confidence: number;
      writeup: QuadrantWriteup;
    }
  >;
  disclaimer: string;
}

export const DEFAULT_RESULTS_CONTENT: ResultsContentData = {
  disclaimer:
    "Dude, this is totally for fun and vibes only, not science or life advice.",
  landingTitle: "Vibe-o-meter, Dude",
  landingSubtitle:
    "A most excellent nonsense-powered personality quest with absolutely questionable certainty.",
  startButtonLabel: "Start This Totally Gnarly Quiz",
  restartButtonLabel: "Restart the Vibe Ride",
  resultsHeading: "Your Most Excellent Vibe Results"
};

export function isAxisKey(value: string): value is AxisKey {
  return (AXIS_KEYS as readonly string[]).includes(value);
}

export function isTypeCodeAxis(value: string): value is TypeCodeAxis {
  return (TYPE_CODE_AXES_DEFAULT as readonly string[]).includes(value);
}

export function isBitOrderAxis(value: string): value is BitOrderAxis {
  return (BIT_ORDER_AXES_DEFAULT as readonly string[]).includes(value);
}
