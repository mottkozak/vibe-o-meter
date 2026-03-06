import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompassMiniChart } from "../components/CompassMiniChart";
import { PersonalityRadarChart } from "../components/PersonalityRadarChart";
import { generateResult } from "../lib/resultGenerator";
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

function getCroppedObjectImageSrc(objectName: string): string {
  const baseSrc = getObjectImageSrc(objectName);
  const fileName = baseSrc.split("/").pop() ?? "";
  const stem = fileName.replace(/\.png$/i, "");
  return `${import.meta.env.BASE_URL}images/cropped_mascots/${stem}_cropped_processed_by_imagy.png`;
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

function getRarityTier(typeCode: string): RarityTier {
  return RARITY_BY_TYPE_CODE[typeCode.trim().toUpperCase()] ?? "Common";
}

function getRarityClass(tier: RarityTier): string {
  return `rarity-${tier.toLowerCase()}`;
}

function getCardStatLabel(compassId: string, fallbackName: string): string {
  const byId: Record<string, string> = {
    power: "Power Scan",
    order: "Order Alignment",
    discipline: "Discipline Scan",
    social: "Social Signal",
    risk: "Risk Calibration"
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
    power: "Power Scan",
    order: "Order Alignment",
    discipline: "Discipline Scan",
    social: "Social Signal",
    risk: "Risk Calibration"
  };

  return labelById[compassId] ?? "Style";
}

function getRadarLabel(compassId: string): string {
  const labelById: Record<string, string> = {
    power: "Power",
    order: "Order",
    discipline: "Discipline",
    social: "Social",
    risk: "Risk"
  };

  return labelById[compassId] ?? "Scan";
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

const SHAPE_FAMILY_PREFIX: Record<string, string> = {
  VH: "Iron",
  WH: "Aegis",
  VG: "Sage",
  WG: "Rogue"
};

const SHAPE_SLOT_NAMES = [
  "Vanguard",
  "Catalyst",
  "Trailblazer",
  "Signal",
  "Anchor",
  "Maverick",
  "Navigator",
  "Voltage",
  "Wildcard",
  "Sentinel",
  "Pulse",
  "Operator",
  "Waypoint",
  "Drift",
  "Cipher",
  "Comet"
] as const;

function getPersonalityShape(
  typeFamilyKey: string,
  titleIndex: number,
  breakdown: GeneratedResult["compassBreakdown"]
): { name: string; traits: string[] } {
  const familyPrefix = SHAPE_FAMILY_PREFIX[typeFamilyKey] ?? "Nova";
  const slotName = SHAPE_SLOT_NAMES[((titleIndex % 16) + 16) % 16];
  const computedName = `${familyPrefix} ${slotName}`;

  const sortedByConfidence = [...breakdown].sort((left, right) => right.confidence - left.confidence);
  const strongest = sortedByConfidence[0];
  const support = sortedByConfidence[1] ?? strongest;
  const flexible = sortedByConfidence[sortedByConfidence.length - 1] ?? strongest;

  const strongestMatrix = strongest ? getMatrixSummaryLabel(strongest.compass.id) : "Primary Scan";
  const supportMatrix = support ? getMatrixSummaryLabel(support.compass.id) : "Support Scan";
  const flexibleMatrix = flexible ? getMatrixSummaryLabel(flexible.compass.id) : "Adaptive Scan";

  const strongestLabel = strongest?.quadrant.label ?? "Adaptive";
  const supportLabel = support?.quadrant.label ?? "Balanced";
  const flexibleLabel = flexible?.quadrant.label ?? "Flexible";

  return {
    name: computedName,
    traits: [
      `Dominant ${strongestMatrix}: ${strongestLabel}.`,
      `Support signal from ${supportMatrix}: ${supportLabel}.`,
      `Most adaptable zone is ${flexibleMatrix} with ${flexibleLabel} tendencies.`
    ]
  };
}

export function ResultsPage({ data }: ResultsPageProps): JSX.Element {
  const navigate = useNavigate();
  const { axisScores, isComplete, questions, selectedQuizLength } = useQuiz();
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [objectImageFailed, setObjectImageFailed] = useState(false);
  const [cardImageSrc, setCardImageSrc] = useState<string>("");
  const [isRevealing, setIsRevealing] = useState(true);
  const [revealProgress, setRevealProgress] = useState(0);
  const [revealStatus, setRevealStatus] = useState("Collecting personality data...");
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
    if (!isComplete || !resultState.result) {
      setIsRevealing(true);
      setRevealProgress(0);
      setRevealStatus("Collecting personality data...");
      return;
    }

    setIsRevealing(true);
    setRevealProgress(0);
    setRevealStatus("Collecting personality data...");

    const totalDurationMs = 5000 + Math.floor(Math.random() * 2000);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(100, Math.round((elapsed / totalDurationMs) * 100));
      setRevealProgress(progress);

      if (progress < 34) {
        setRevealStatus("Collecting personality data...");
      } else if (progress < 72) {
        setRevealStatus("Behavior analysis in progress...");
      } else {
        setRevealStatus("Finalizing object alignment...");
      }

      if (progress >= 100) {
        window.clearInterval(timer);
        setIsRevealing(false);
      }
    }, 55);

    return () => {
      window.clearInterval(timer);
    };
  }, [isComplete, resultState.result?.typeCode]);

  if (!selectedQuizLength) {
    return (
      <main className="screen-shell">
        <section className="card">
          <h1>Game Session Not Started</h1>
          <p>Go back to the intro screen and press Begin first.</p>
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
  const cardCelebs = (result.celebs.length > 0 ? result.celebs : ["No famous vibe buddies listed."]).slice(0, 6);

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
  const rarityClass = getRarityClass(rarityTier);
  const primaryObjectImageSrc = getObjectImageSrc(primaryObject);
  const primaryObjectCroppedImageSrc = getCroppedObjectImageSrc(primaryObject);
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
      title: getMatrixSummaryLabel(item.compass.id),
      axisPair: `${formatAxisLabel(xAxis.negLabel)} \u2194 ${formatAxisLabel(xAxis.posLabel)}`,
      leanLine: `You lean ${leanStrength} ${leanLabel}`
    };
  });
  const matrixIdentityLead = powerBreakdown
    ? `You are a ${powerBreakdown.quadrant.label} in power scan mode \u2014 you lead with direct action and fast adaptation.`
    : "Your power scan is still loading.";
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
  const personalityShape = getPersonalityShape(
    result.typeFamilyKey,
    result.titleIndex,
    result.compassBreakdown
  );
  const radarPoints = result.compassBreakdown.map((item) => ({
    id: item.compass.id,
    label: getRadarLabel(item.compass.id),
    value: item.confidence
  }));
  useEffect(() => {
    setObjectImageFailed(false);
    setCardImageSrc(primaryObjectCroppedImageSrc);
  }, [primaryObjectCroppedImageSrc, primaryObject]);

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
            {isRevealing ? (
              <div>
                <h2 className="results-heading">Calculating Object Form</h2>
                <p className="results-hook">Hold steady while the matrices complete your alignment...</p>
              </div>
            ) : (
              <div>
                <h2 className="results-heading">Your Results</h2>
                <div className="result-meta-row">
                  <span className="code-pill">{primaryObject}</span>
                  <span className="code-pill">{result.typeCode}</span>
                  <span className="subtype-pill">{powerSubtype}</span>
                </div>
                <p className="results-hook">{revealHook || primaryFlavorLine}</p>
              </div>
            )}
          </div>
        </section>

        {isRevealing ? (
          <section className="alignment-scanner" aria-live="polite">
            <p className="alignment-scanner-head">Scanning object alignment...</p>
            <p className="alignment-scanner-status">{revealStatus}</p>
            <div className="alignment-progress-track" role="img" aria-label={`${revealProgress}% complete`}>
              <div className="alignment-progress-fill" style={{ width: `${revealProgress}%` }} />
            </div>
            <p className="alignment-progress-meta">{revealProgress}%</p>
          </section>
        ) : null}

        {!isRevealing ? (
          <>
        <section className="pokedex-viewer" aria-label="Registered personality card viewer">
          <p className="eyebrow">Registered Personality Card</p>
          <section
            ref={shareCardRef}
            className={`shareable-card trading-card card-enter ${cardThemeClass} ${rarityClass}`}
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
                  {!objectImageFailed && cardImageSrc ? (
                    <img
                      className="object-asset"
                      src={cardImageSrc}
                      alt={`${primaryObject} illustration`}
                      loading="eager"
                      onError={() => {
                        if (cardImageSrc !== primaryObjectImageSrc) {
                          setCardImageSrc(primaryObjectImageSrc);
                          return;
                        }
                        setObjectImageFailed(true);
                      }}
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
              Save Card
            </button>
            <button className="secondary-button" type="button" onClick={() => void handleShare()}>
              Share Entry
            </button>
          </div>
        </section>

        {actionStatus ? <p className="muted action-status">{actionStatus}</p> : null}

        <details className="diagnostics-details">
          <summary>
            <span>Object Database Entry</span>
            <span className="diagnostics-summary-hint" aria-hidden="true" />
          </summary>
          <section className="diagnostics-section">
            <div className="diagnostics-content">
              <h3>Entry Summary</h3>
              <div className="matrix-summary-panel">
                {matrixSummaryRows.map((row) => (
                  <p key={row.id}>
                    <strong>{row.label}:</strong> {row.value}
                  </p>
                ))}
              </div>

              <h3>Matrix Identity</h3>
              <div className="matrix-identity-panel">
                <p className="matrix-identity-lead">{matrixIdentityLead}</p>
                <p className="matrix-identity-secondary">{matrixIdentitySecondary}</p>
                <p className="matrix-identity-close">{matrixIdentityClose}</p>
              </div>

              <h3>Behavioral Tendencies</h3>
              <div className="matrix-breakdown-list">
                {matrixBreakdownRows.map((row) => (
                  <article className="matrix-breakdown-row" key={row.id}>
                    <p className="matrix-breakdown-title">{row.title}</p>
                    <p className="matrix-breakdown-axis">{row.axisPair}</p>
                    <p className="matrix-breakdown-lean">{row.leanLine}</p>
                  </article>
                ))}
              </div>

              <h3>Matrix Readout</h3>
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
                <summary>View Advanced Scan Data</summary>
                <div className="chart-grid-layout diagnostics-chart-grid">
                  {result.compassBreakdown.map((item) => (
                    <CompassMiniChart
                      key={item.compass.id}
                      title={getMatrixSummaryLabel(item.compass.id)}
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
          </>
        ) : null}
      </section>
    </main>
  );
}
