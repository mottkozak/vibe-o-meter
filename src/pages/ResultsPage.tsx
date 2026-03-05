import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompassMiniChart } from "../components/CompassMiniChart";
import { PersonalityRadarChart } from "../components/PersonalityRadarChart";
import { getObjectsForType } from "../lib/objectGenerator";
import { generateResult } from "../lib/resultGenerator";
import { resolveTypeTitle } from "../lib/scoring";
import { useQuiz } from "../state/QuizContext";
import type { GeneratedResult, LoadedAppData, ObjectAbility } from "../types";

interface ResultsPageProps {
  data: LoadedAppData;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Dude, the result wizard totally face-planted.";
}

function getObjectGlyph(objectName: string): string {
  const value = objectName.toLowerCase();

  if (value.includes("mug") || value.includes("teapot") || value.includes("spoon")) {
    return "☕";
  }
  if (value.includes("pencil") || value.includes("pen") || value.includes("note")) {
    return "✏️";
  }
  if (value.includes("wrench") || value.includes("hammer") || value.includes("screwdriver")) {
    return "🔧";
  }
  if (value.includes("dice") || value.includes("balloon") || value.includes("yoyo")) {
    return "🎲";
  }
  if (value.includes("bucket") || value.includes("hose") || value.includes("plunger")) {
    return "🪣";
  }

  return "📦";
}

function getFirstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }

  const match = trimmed.match(/[^.!?]+[.!?]?/);
  return (match?.[0] ?? trimmed).trim();
}

function toMatrixLabel(value: string): string {
  return value.replace(/compass/gi, "Matrix");
}

function getCardThemeClass(subtype: string): string {
  const value = subtype.toLowerCase();

  if (value.includes("viking") || value.includes("gladiator")) {
    return "card-theme-viking";
  }
  if (value.includes("wizard") || value.includes("philosopher")) {
    return "card-theme-wizard";
  }
  if (value.includes("hero") || value.includes("knight")) {
    return "card-theme-hero";
  }
  if (value.includes("goblin") || value.includes("jester") || value.includes("rogue")) {
    return "card-theme-goblin";
  }

  return "card-theme-default";
}

const OBJECT_IMAGE_OVERRIDES: Record<string, string> = {
  "5 gallon bucket": "5_gallon_bucket.png",
  "bottle cap": "bottlecap.png",
  "light switch": "lightswitch.png",
  "measuring tape": "tape_measure.png",
  "rubber band": "rubberband.png",
  "soap bar": "soap.png",
  tongs: "salad_tongs.png",
  windchime: "windchimes.png",
  "yo yo": "yo-yo.png",
  "yo-yo": "yo-yo.png"
};

function getObjectImageSrc(objectName: string): string {
  const normalized = objectName.trim().toLowerCase();
  const override = OBJECT_IMAGE_OVERRIDES[normalized];
  const fileName =
    override ??
    `${normalized
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")}.png`;

  return `${import.meta.env.BASE_URL}images/${fileName}`;
}

function getObjectClassLabel(subtype: string): string {
  const value = subtype.toLowerCase();

  if (value.includes("hero") || value.includes("knight") || value.includes("queen")) {
    return "Guardian";
  }
  if (value.includes("wizard") || value.includes("philosopher") || value.includes("sensei")) {
    return "Strategist";
  }
  if (value.includes("goblin") || value.includes("jester") || value.includes("trickster")) {
    return "Wildcard";
  }
  if (value.includes("viking") || value.includes("gladiator") || value.includes("cowboy")) {
    return "Trailblazer";
  }

  return "Balancer";
}

type RarityTier = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

const RARITY_TYPE_CODES: Record<RarityTier, readonly string[]> = {
  Common: [
    "WHKJCM",
    "WHKJSM",
    "WHKRCM",
    "WHKRSM",
    "VHKJCM",
    "VHKJSM",
    "VHKRCM",
    "VHKRSM",
    "WHPCJM",
    "WHPCSM",
    "VHKPJM",
    "VHKPSM"
  ],
  Uncommon: [
    "WHKJCA",
    "WHKJSA",
    "WHKRCA",
    "WHKRSA",
    "VHKJCA",
    "VHKJSA",
    "VHKRCA",
    "VHKRSA",
    "WHPCJA",
    "WHPCSA",
    "VHKPJA",
    "VHKPSA",
    "WGKJCM",
    "WGKJSM",
    "WGKRCM",
    "WGKRSM",
    "VGKJCM",
    "VGKJSM",
    "VGKRCM",
    "VGKRSM"
  ],
  Rare: [
    "WGPCJM",
    "WGPCSM",
    "WGPCJA",
    "WGPCSA",
    "VGPCJM",
    "VGPCSM",
    "VGPCJA",
    "VGPCSA",
    "WGPRJM",
    "WGPRSM",
    "WGPRJA",
    "WGPRSA",
    "VGPRJM",
    "VGPRSM",
    "VGPRJA",
    "VGPRSA"
  ],
  Epic: [
    "WGPJCM",
    "WGPJSM",
    "WGPRCM",
    "WGPRSM",
    "VGPJCM",
    "VGPJSM",
    "VGPRCM",
    "VGPRSM",
    "WGPJCA",
    "WGPJSA",
    "WGPRCA",
    "WGPRSA"
  ],
  Legendary: ["VGPJCA", "VGPJSA", "VGPRCA", "VGPRSA"]
};

const RARITY_BY_TYPE_CODE: Record<string, RarityTier> = Object.fromEntries(
  (Object.entries(RARITY_TYPE_CODES) as Array<[RarityTier, readonly string[]]>).flatMap(
    ([tier, codes]) => codes.map((code) => [code, tier] as const)
  )
) as Record<string, RarityTier>;

const DEFAULT_BIT_LETTERS = {
  KP: { 0: "K", 1: "P" },
  RJ: { 0: "R", 1: "J" },
  SC: { 0: "S", 1: "C" },
  MA: { 0: "M", 1: "A" }
} as const;

interface CardCatalogEntry {
  typeCode: string;
  title: string;
  primaryObject: string;
  rarity: RarityTier;
  imageSrc: string | null;
}

function getRarityTier(typeCode: string): RarityTier {
  return RARITY_BY_TYPE_CODE[typeCode.trim().toUpperCase()] ?? "Common";
}

function getLetterForBit(
  data: LoadedAppData["typeTitles"],
  axis: "KP" | "RJ" | "SC" | "MA",
  bit: 0 | 1
): string {
  const key = String(bit) as "0" | "1";
  const configured = data.bitMeaning[axis]?.[key];
  if (typeof configured === "string" && configured.trim()) {
    return configured.trim().charAt(0).toUpperCase();
  }
  return DEFAULT_BIT_LETTERS[axis][bit];
}

function buildCatalogEntries(data: LoadedAppData): CardCatalogEntry[] {
  const familyOrder = ["VH", "WH", "VG", "WG"].filter(
    (familyKey) => Boolean(data.typeTitles.families[familyKey])
  );
  const bitAxes = data.typeTitles.bitOrder;
  const entries: CardCatalogEntry[] = [];

  for (const familyKey of familyOrder) {
    for (let index = 0; index < 16; index += 1) {
      const suffix = bitAxes
        .map((axis, axisIndex) => {
          const bit = ((index >> axisIndex) & 1) as 0 | 1;
          return getLetterForBit(data.typeTitles, axis, bit);
        })
        .join("");
      const typeCode = `${familyKey}${suffix}`;

      let title = typeCode;
      let resolvedIndex = index;
      try {
        const resolution = resolveTypeTitle(typeCode, data.typeTitles);
        title = resolution.title;
        resolvedIndex = resolution.index;
      } catch {
        // leave fallback title/index
      }

      let primaryObject = "Unknown Object";
      if (data.objectsData) {
        try {
          primaryObject = getObjectsForType(typeCode, resolvedIndex, data.objectsData).primaryObject;
        } catch {
          // keep fallback
        }
      }

      entries.push({
        typeCode,
        title,
        primaryObject,
        rarity: getRarityTier(typeCode),
        imageSrc: primaryObject === "Unknown Object" ? null : getObjectImageSrc(primaryObject)
      });
    }
  }

  return entries;
}

function getCardStatLabel(compassId: string, fallbackName: string): string {
  const byId: Record<string, string> = {
    power: "Power Compass",
    order: "Order Compass",
    discipline: "Discipline Compass",
    social: "Social Style Compass",
    risk: "Risk Compass"
  };

  return byId[compassId] ?? fallbackName;
}

function getObjectAbilitiesForCard(
  abilitiesByObject: Record<string, ObjectAbility[]> | undefined,
  objectName: string
): ObjectAbility[] {
  if (!abilitiesByObject) {
    return [];
  }

  const exact = abilitiesByObject[objectName];
  if (exact && exact.length > 0) {
    return exact;
  }

  const trimmedName = objectName.trim();
  const trimmed = abilitiesByObject[trimmedName];
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }

  const normalized = trimmedName.toLowerCase();
  const matchedEntry = Object.entries(abilitiesByObject).find(
    ([key]) => key.trim().toLowerCase() === normalized
  );

  return matchedEntry?.[1] ?? [];
}

function getMatrixSummaryLabel(compassId: string): string {
  const labelById: Record<string, string> = {
    power: "Power Style",
    order: "Order Style",
    discipline: "Discipline Style",
    social: "Social Style",
    risk: "Risk Style"
  };

  return labelById[compassId] ?? "Style";
}

function getAxisLeanStrength(score: number): "slightly" | "moderately" | "strongly" {
  const absValue = Math.abs(score);
  if (absValue >= 8) {
    return "strongly";
  }
  if (absValue >= 4) {
    return "moderately";
  }
  return "slightly";
}

function getAxisFlavor(label: string): string {
  const byLabel: Record<string, string> = {
    viking: "Strength, Impulse",
    wizard: "Brain, Logic",
    knight: "Order, Duty",
    pirate: "Freedom, Rebellion",
    samurai: "Discipline, Precision",
    cowboy: "Independence, Grit",
    princess: "Polish, Grace",
    tomboy: "Practical, Rugged",
    philosopher: "Reflection, Analysis",
    gladiator: "Action, Courage"
  };

  return byLabel[label.trim().toLowerCase()] ?? "Core Trait";
}

function formatAxisLabel(label: string): string {
  return `${label} (${getAxisFlavor(label)})`;
}

function getPersonalityShape(
  breakdown: GeneratedResult["compassBreakdown"]
): { name: string; traits: string[] } {
  const confidenceById: Record<string, number> = Object.fromEntries(
    breakdown.map((item) => [item.compass.id, item.confidence])
  );

  const power = confidenceById.power ?? 0;
  const order = confidenceById.order ?? 0;
  const discipline = confidenceById.discipline ?? 0;
  const social = confidenceById.social ?? 0;
  const risk = confidenceById.risk ?? 0;

  if (power >= 65 && risk >= 45) {
    return {
      name: "The Explorer",
      traits: ["Strong action energy", "Learns by trying and adapting", "Comfortable with uncertainty"]
    };
  }

  if (order >= 65 && discipline >= 65) {
    return {
      name: "The Architect",
      traits: ["Builds structure quickly", "Reliable under pressure", "Prefers strategy over improvisation"]
    };
  }

  if (social >= 65 && order >= 55) {
    return {
      name: "The Diplomat",
      traits: ["Strong social calibration", "Balances systems and people", "Keeps groups moving together"]
    };
  }

  if (risk >= 65 && power >= 50) {
    return {
      name: "The Maverick",
      traits: ["Fast decisions in uncertain moments", "Thrives in momentum", "Turns friction into opportunity"]
    };
  }

  if (discipline >= 65 && risk <= 40) {
    return {
      name: "The Sentinel",
      traits: ["Steady execution", "High consistency", "Protects progress over spectacle"]
    };
  }

  return {
    name: "The Pathfinder",
    traits: ["Balanced across multiple styles", "Adaptable in mixed situations", "Finds practical routes forward"]
  };
}

export function ResultsPage({ data }: ResultsPageProps): JSX.Element {
  const navigate = useNavigate();
  const { axisScores, isComplete, restartQuiz, questions, selectedQuizLength } = useQuiz();
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [objectImageFailed, setObjectImageFailed] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clearPrintMode = (): void => {
      document.body.classList.remove("print-share-card");
    };

    window.addEventListener("afterprint", clearPrintMode);
    return () => {
      window.removeEventListener("afterprint", clearPrintMode);
      clearPrintMode();
    };
  }, []);

  const resultState = useMemo<{ result: GeneratedResult | null; error: string | null }>(() => {
    if (!isComplete) {
      return {
        result: null,
        error: null
      };
    }

    try {
      return {
        result: generateResult(data, axisScores, questions),
        error: null
      };
    } catch (error) {
      return {
        result: null,
        error: toErrorMessage(error)
      };
    }
  }, [axisScores, data, isComplete, questions]);

  useEffect(() => {
    setObjectImageFailed(false);
  }, [resultState.result?.householdArchetype?.primaryObject]);

  if (!selectedQuizLength) {
    return (
      <main className="screen-shell">
        <section className="card">
          <h1>Pick Your Accuracy Mode First</h1>
          <p>Choose Kinda, Mostly, or Extremely Accurate from the opening screen.</p>
          <div className="button-row">
            <button className="primary-button" type="button" onClick={() => navigate("/")}>
              Back to Home Base
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!isComplete) {
    return (
      <main className="screen-shell">
        <section className="card">
          <h1>Results Are Not Yet Most Excellent</h1>
          <p>
            Totally finish all {questions.length} questions before we unleash your archetype vibes.
          </p>
          <div className="button-row">
            <button className="primary-button" type="button" onClick={() => navigate("/quiz")}> 
              Back to the Quiz, Dude
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (resultState.error || !resultState.result) {
    return (
      <main className="screen-shell">
        <section className="card error-card">
          <h1>Most Unexcellent Results Glitch</h1>
          <p>{resultState.error ?? "No result data available."}</p>
          <div className="button-row">
            <button className="primary-button" type="button" onClick={() => navigate("/quiz")}> 
              Cruise Back to Quiz
            </button>
          </div>
        </section>
      </main>
    );
  }

  const result = resultState.result;

  const cardStrengths = (result.strengths.length > 0 ? result.strengths : ["Data loading..."]).slice(0, 2);
  const cardWeaknesses = (result.watchouts.length > 0 ? result.watchouts : ["Data loading..."]).slice(0, 2);
  const cardCelebs = (result.celebs.length > 0 ? result.celebs : ["No famous vibe buddies listed."]).slice(0, 3);

  const primaryObject = result.householdArchetype?.primaryObject ?? "Unknown";
  const primaryReason =
    result.householdArchetype?.primaryReason ?? "Reliable utility with surprising personality.";
  const powerSubtype =
    result.compassBreakdown.find((item) => item.compass.id === "power")?.quadrant.label ??
    "Unknown subtype";
  const revealHook =
    getFirstSentence(result.powerOneLiner) ||
    getFirstSentence(result.summary) ||
    "The friend who shows up before the group chat finishes typing.";
  const primaryFlavorLine = getFirstSentence(primaryReason) || "Builds order out of chaos.";
  const objectAbilitiesForPrimary = getObjectAbilitiesForCard(
    data.objectsData?.objectAbilities,
    primaryObject
  );
  const cardAbilities: ObjectAbility[] =
    objectAbilitiesForPrimary && objectAbilitiesForPrimary.length > 0
      ? objectAbilitiesForPrimary.slice(0, 2)
      : [
          {
            name: "Fallback",
            description: `Custom abilities are missing for ${primaryObject}.`
          }
        ];
  const cardThemeClass = getCardThemeClass(powerSubtype);
  const objectClass = getObjectClassLabel(powerSubtype);
  const rarityTier = getRarityTier(result.typeCode);
  const primaryObjectImageSrc = getObjectImageSrc(primaryObject);
  const familyRankByKey: Record<string, number> = { VH: 0, WH: 1, VG: 2, WG: 3 };
  const familyRank = familyRankByKey[result.typeFamilyKey] ?? 0;
  const typeOrdinal = familyRank * 16 + result.titleIndex + 1;
  const cardSerial = `${result.typeCode}-${String(typeOrdinal).padStart(3, "0")}`;
  const comparisonsLine = cardCelebs.join(", ");
  const breakdownById = new Map(result.compassBreakdown.map((item) => [item.compass.id, item]));
  const powerBreakdown = breakdownById.get("power") ?? result.compassBreakdown[0];
  const orderBreakdown = breakdownById.get("order");
  const disciplineBreakdown = breakdownById.get("discipline");
  const socialBreakdown = breakdownById.get("social");
  const riskBreakdown = breakdownById.get("risk");
  const matrixSummaryRows = result.compassBreakdown.map((item) => ({
    id: item.compass.id,
    label: getMatrixSummaryLabel(item.compass.id),
    value: item.quadrant.label
  }));
  const matrixBreakdownRows = result.compassBreakdown.map((item) => {
    const xAxis = data.compasses.axes[item.compass.xAxis];
    const leanLabel = item.x >= 0 ? xAxis.posLabel : xAxis.negLabel;
    const leanStrength = getAxisLeanStrength(item.x);
    return {
      id: item.compass.id,
      title: toMatrixLabel(item.compass.name),
      axisPair: `${formatAxisLabel(xAxis.negLabel)} \u2194 ${formatAxisLabel(xAxis.posLabel)}`,
      leanLine: `You lean ${leanStrength} ${leanLabel}`
    };
  });
  const matrixIdentityLead = powerBreakdown
    ? `You are a ${powerBreakdown.quadrant.label} in power style \u2014 you lead with direct action and fast adaptation.`
    : "Your power style is still loading.";
  const secondaryLabels = [
    orderBreakdown?.quadrant.label,
    disciplineBreakdown?.quadrant.label,
    socialBreakdown?.quadrant.label,
    riskBreakdown?.quadrant.label
  ].filter((label): label is string => Boolean(label));
  const matrixIdentitySecondary =
    secondaryLabels.length > 0
      ? `Your secondary tendencies blend ${secondaryLabels.join(", ")}.`
      : "Secondary tendencies are still calibrating.";
  const matrixIdentityClose =
    "This creates a profile that moves quickly, improvises when needed, and learns through momentum.";
  const personalityShape = getPersonalityShape(result.compassBreakdown);
  const radarPoints = result.compassBreakdown.map((item) => ({
    id: item.compass.id,
    label: getMatrixSummaryLabel(item.compass.id).replace(" Style", ""),
    value: item.confidence
  }));
  const allCardEntries = useMemo(() => buildCatalogEntries(data), [data]);

  const handleDownloadCard = (): void => {
    if (!shareCardRef.current) {
      setActionStatus("Card view is still loading. Try again in a moment.");
      return;
    }

    document.body.classList.add("print-share-card");
    setActionStatus("Opening print dialog. Choose 'Save as PDF' to download your card.");
    window.print();
    window.setTimeout(() => {
      document.body.classList.remove("print-share-card");
    }, 500);
  };

  const handleCopyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setActionStatus("Result link copied.");
    } catch {
      setActionStatus("Could not copy the link automatically on this browser.");
    }
  };

  const handleShare = async (): Promise<void> => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: result.archetypeTitle,
          text: `My vibe result: ${result.archetypeTitle} (${result.typeCode})`,
          url: window.location.href
        });
        setActionStatus("Shared successfully.");
        return;
      }

      await handleCopyLink();
      setActionStatus("Share is not supported here, so the link was copied instead.");
    } catch {
      setActionStatus("Share was canceled or unavailable.");
    }
  };

  return (
    <main className="screen-shell">
      <section className="card results-card">
        <section className="results-reveal">
          <div className="results-head">
            <div>
              <p className="eyebrow">RESULTS_VIEWER.EXE</p>
              <h2 className="results-heading">Your Results</h2>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                restartQuiz();
                navigate("/");
              }}
            >
              {data.resultsContent.restartButtonLabel}
            </button>
          </div>
        </section>

        <section
          ref={shareCardRef}
          className={`shareable-card trading-card ${cardThemeClass}`}
          aria-label="Shareable results card"
        >
          <div className="shareable-card-content">
            <header className="trading-card-top">
              <div className="card-head-grid">
                <p className="card-object-name">{primaryObject}</p>
                <p className="card-personality-class">{powerSubtype}</p>
                <p className="card-type-line">
                  Type: <strong>{result.typeCode}</strong>
                </p>
                <p className="card-object-class-line">
                  Object Class: <strong>{objectClass}</strong>
                </p>
              </div>
            </header>

            <section className="trading-card-section trading-art-panel">
              <div className="trading-art-frame" aria-label={`Primary object ${primaryObject}`}>
                <p className="card-rarity-badge">
                  Rarity: <span className="rarity-star">★</span> {rarityTier}
                </p>
                <div className="art-vignette" aria-hidden="true" />
                {!objectImageFailed ? (
                  <img
                    className="object-asset"
                    src={primaryObjectImageSrc}
                    alt={`${primaryObject} illustration`}
                    loading="eager"
                    onError={() => setObjectImageFailed(true)}
                  />
                ) : null}
                {objectImageFailed ? <div className="object-glyph">{getObjectGlyph(primaryObject)}</div> : null}
              </div>
            </section>

            <section className="trading-card-section trading-flavor-section">
              <p className="trading-flavor">"{revealHook || primaryFlavorLine}"</p>
            </section>

            <section className="trading-card-section">
              <div className="trading-traits-grid">
                <article className="trait-card">
                  <h3>Weaknesses</h3>
                  <ul>
                    {cardWeaknesses.map((watchout) => (
                      <li key={watchout}>{watchout}</li>
                    ))}
                  </ul>
                </article>
                <article className="trait-card">
                  <h3>Strengths</h3>
                  <ul>
                    {cardStrengths.map((strength) => (
                      <li key={strength}>{strength}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>

            <section className="trading-card-section">
              <h3>Abilities</h3>
              {result.householdArchetype ? (
                <ul className="abilities-bullet-list">
                  {cardAbilities.map((ability) => (
                    <li key={`${primaryObject}-${ability.name}`}>
                      <strong>{ability.name}</strong> — {ability.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">
                  {result.householdArchetypeMessage ??
                    "Object power data is unavailable for this run, but the main diagnostics still work."}
                </p>
              )}
            </section>

            <section className="trading-card-section">
              <h3>Stats</h3>
              <ul className="card-stats-list">
                {result.compassBreakdown.map((item) => (
                  <li key={item.compass.id} className="card-stat-row">
                    <span className="card-stat-label">{getCardStatLabel(item.compass.id, item.compass.name)}</span>
                    <span className="card-stat-segments" role="img" aria-label={`${item.confidence}%`}>
                      {Array.from({ length: 10 }, (_, index) => (
                        <span
                          key={`${item.compass.id}-seg-${index}`}
                          className={index < Math.round(item.confidence / 10) ? "filled" : ""}
                        />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <footer className="card-footer-meta">
              <p className="comparisons-line">{comparisonsLine}</p>
              <p className="card-id-line">{cardSerial}</p>
            </footer>
          </div>
        </section>

        <div className="button-row results-actions">
          <button className="primary-button" type="button" onClick={handleDownloadCard}>
            Download Card
          </button>
          <button className="secondary-button" type="button" onClick={() => void handleShare()}>
            Share With Friends
          </button>
        </div>
        {actionStatus ? <p className="muted action-status">{actionStatus}</p> : null}

        <details className="diagnostics-details">
          <summary>
            <span>Full Personality Diagnostics</span>
            <span className="diagnostics-summary-hint" aria-hidden="true" />
          </summary>
          <section className="diagnostics-section">
            <div className="diagnostics-content">
              <h3>Personality Matrix Summary</h3>
              <div className="matrix-summary-panel">
                {matrixSummaryRows.map((row) => (
                  <p key={row.id}>
                    <strong>{row.label}:</strong> {row.value}
                  </p>
                ))}
              </div>

              <h3>Your Matrix Identity</h3>
              <p>{matrixIdentityLead}</p>
              <p>{matrixIdentitySecondary}</p>
              <p>{matrixIdentityClose}</p>

              <h3>Personality Matrix Breakdown</h3>
              <div className="matrix-breakdown-list">
                {matrixBreakdownRows.map((row) => (
                  <article className="matrix-breakdown-row" key={row.id}>
                    <p className="matrix-breakdown-title">{row.title}</p>
                    <p className="matrix-breakdown-axis">{row.axisPair}</p>
                    <p className="matrix-breakdown-lean">{row.leanLine}</p>
                  </article>
                ))}
              </div>

              <h3>Personality Shape</h3>
              <div className="personality-shape-panel">
                <p className="personality-shape-name">
                  Your Personality Shape: <strong>{personalityShape.name}</strong>
                </p>
                <PersonalityRadarChart points={radarPoints} />
                <ul className="personality-shape-traits">
                  {personalityShape.traits.map((trait) => (
                    <li key={trait}>{trait}</li>
                  ))}
                </ul>
              </div>

              <details className="diagnostic-charts-toggle">
                <summary>View Matrix Charts</summary>
                <div className="chart-grid-layout diagnostics-chart-grid">
                  {result.compassBreakdown.map((item) => (
                    <CompassMiniChart
                      key={item.compass.id}
                      title={toMatrixLabel(item.compass.name)}
                      quadrantLabel={item.quadrant.label}
                      x={item.x}
                      y={item.y}
                      confidence={item.confidence}
                      xAxis={data.compasses.axes[item.compass.xAxis]}
                      yAxis={data.compasses.axes[item.compass.yAxis]}
                    />
                  ))}
                </div>
              </details>
            </div>
          </section>
        </details>

        {result.celebsNote ? <p className="muted diagnostics-note">{result.celebsNote}</p> : null}

        <p className="disclaimer">{result.disclaimer}</p>

        <details className="all-cards-browser">
          <summary>View All 64 Cards</summary>
          <p className="muted all-cards-intro">
            Browse every possible result card. Your current one is highlighted.
          </p>
          <div className="all-cards-grid">
            {allCardEntries.map((entry) => (
              <article
                key={entry.typeCode}
                className={`all-card-tile${entry.typeCode === result.typeCode ? " is-current" : ""}`}
              >
                <div className="all-card-top">
                  <p className="all-card-code">{entry.typeCode}</p>
                  <p className="all-card-rarity">{entry.rarity}</p>
                </div>
                <p className="all-card-title">{entry.title}</p>
                <div className="all-card-art" aria-label={`${entry.primaryObject} preview`}>
                  {entry.imageSrc ? (
                    <img
                      src={entry.imageSrc}
                      alt={`${entry.primaryObject} illustration`}
                      loading="lazy"
                    />
                  ) : (
                    <span>{getObjectGlyph(entry.primaryObject)}</span>
                  )}
                </div>
                <p className="all-card-object">{entry.primaryObject}</p>
                {entry.typeCode === result.typeCode ? (
                  <p className="all-card-current">Current Result</p>
                ) : null}
              </article>
            ))}
          </div>
        </details>
      </section>
    </main>
  );
}
