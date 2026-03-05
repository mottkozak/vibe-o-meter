import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompassMiniChart } from "../components/CompassMiniChart";
import { generateResult } from "../lib/resultGenerator";
import { useQuiz } from "../state/QuizContext";
import type { GeneratedResult, LoadedAppData, ObjectAbility } from "../types";

interface ResultsPageProps {
  data: LoadedAppData;
}

const COMPASS_GRID_INFO: Record<
  string,
  {
    descriptor: string;
    bullets: Array<{ label: string; text: string }>;
  }
> = {
  power: {
    descriptor: "Physical vs Mental | Honorable vs Chaotic",
    bullets: [
      {
        label: "Viking (Physical Force)",
        text: "action, courage, instinct, adventure, boldness, kinetic energy"
      },
      {
        label: "Wizard (Mental Power)",
        text: "knowledge, foresight, strategy, patience, intellect, planning"
      },
      {
        label: "Hero (Honor / Responsibility)",
        text: "duty, bravery, reliability, moral backbone, protector energy"
      },
      {
        label: "Goblin (Chaotic Instinct)",
        text: "mischief, opportunism, cleverness, impulse, rule-bending survival"
      }
    ]
  },
  order: {
    descriptor: "Order vs Freedom | Serious vs Playful",
    bullets: [
      {
        label: "Knight (Order / Duty)",
        text: "honor, rules, structure, loyalty, institution-minded"
      },
      {
        label: "Pirate (Freedom / Rebellion)",
        text: "independence, improvisation, defiance, adventure, anti-authority"
      },
      {
        label: "General (Strategic Seriousness)",
        text: "discipline, planning, leadership, responsibility, control"
      },
      {
        label: "Jester (Playful Chaos)",
        text: "humor, disruption, irreverence, provocation, creativity"
      }
    ]
  },
  discipline: {
    descriptor: "Discipline vs Independence | Wisdom vs Mischief",
    bullets: [
      {
        label: "Samurai (Discipline)",
        text: "precision, honor, mastery, ritual, self-control"
      },
      {
        label: "Cowboy (Independence)",
        text: "freedom, rugged improvisation, lone wolf energy"
      },
      {
        label: "Sensei (Wisdom)",
        text: "teacher, composed authority, reflective calm"
      },
      {
        label: "Trickster (Chaos Intelligence)",
        text: "clever disruption, playful deception, rule-breaking creativity"
      }
    ]
  },
  social: {
    descriptor: "Polished vs Rugged | Authority vs Mischief",
    bullets: [
      {
        label: "Princess (Refined)",
        text: "elegance, polish, aesthetics, diplomacy, social grace"
      },
      {
        label: "Tomboy (Rugged Competence)",
        text: "practical, athletic, adventurous, hands-on capability"
      },
      {
        label: "Queen (Authority / Command)",
        text: "leadership, presence, responsibility, strategic power"
      },
      {
        label: "Rogue (Playful Subversion)",
        text: "mischief, clever rebellion, rule-bending charm"
      }
    ]
  },
  risk: {
    descriptor: "Action vs Reflection | Stability vs Impulse",
    bullets: [
      {
        label: "Gladiator (Direct Action)",
        text: "boldness, grit, confrontation, momentum, competitive edge"
      },
      {
        label: "Philosopher (Reflective Analysis)",
        text: "thoughtfulness, long-view strategy, nuance, contemplation"
      },
      {
        label: "Monk (Steady Restraint)",
        text: "patience, control, composure, discipline, emotional stability"
      },
      {
        label: "Gambler (Risk Instinct)",
        text: "experimentation, daring moves, spontaneity, appetite for uncertainty"
      }
    ]
  }
};

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

function getRarityTier(typeCode: string): RarityTier {
  return RARITY_BY_TYPE_CODE[typeCode.trim().toUpperCase()] ?? "Common";
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

  const cardStrengths = (result.strengths.length > 0 ? result.strengths : ["Data loading..."]).slice(0, 3);
  const cardWeaknesses = (result.watchouts.length > 0 ? result.watchouts : ["Data loading..."]).slice(0, 3);
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
  const primaryAbility = getFirstSentence(primaryReason) || primaryReason;
  const objectAbilitiesForPrimary = data.objectsData?.objectAbilities?.[primaryObject];
  const cardAbilities: ObjectAbility[] =
    objectAbilitiesForPrimary && objectAbilitiesForPrimary.length > 0
      ? objectAbilitiesForPrimary.slice(0, 2)
      : [
          {
            name: primaryObject,
            description: primaryAbility
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
              <h2 className="results-heading">{data.resultsContent.resultsHeading}</h2>
              <h1>{result.archetypeTitle}</h1>
              <div className="result-meta-row">
                <p className="code-pill">TYPE: {result.typeCode}</p>
                <p className="subtype-pill">{powerSubtype}</p>
              </div>
              <p className="results-hook">{revealHook}</p>
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

        <p className="card-generated-label">GENERATED PERSONALITY CARD</p>
        <h2 className="results-tier-title">Shareable Trading Card</h2>
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
                <div className="abilities-list">
                  {cardAbilities.map((ability) => (
                    <article className="ability-entry" key={`${primaryObject}-${ability.name}`}>
                      <p className="ability-name">
                        <strong>Ability:</strong> {ability.name}
                      </p>
                      <p className="ability-text">{ability.description}</p>
                    </article>
                  ))}
                </div>
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

            <section className="trading-card-section trading-companion">
              <h3>Comparisons</h3>
              <p className="comparisons-line">{comparisonsLine}</p>
            </section>

            <p className="card-id-line">{cardSerial}</p>
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
              <h3>Matrix Charts</h3>
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
                    infoBlurb={COMPASS_GRID_INFO[item.compass.id]}
                  />
                ))}
              </div>

              <h3>Expanded Strengths</h3>
              <ul>
                {result.strengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>

              <h3>Expanded Weaknesses</h3>
              <ul>
                {result.watchouts.map((watchout) => (
                  <li key={watchout}>{watchout}</li>
                ))}
              </ul>

              <h3>Field Dossier</h3>
              <p>
                Type code <strong>{result.typeCode}</strong> resolves to <strong>{primaryObject}</strong>, with
                subtype <strong>{powerSubtype}</strong>.
              </p>

              <h3>Object Lore</h3>
              {result.householdArchetype ? (
                <p>
                  <strong>{primaryObject}:</strong> {primaryReason}
                </p>
              ) : (
                <p className="muted">
                  {result.householdArchetypeMessage ??
                    "Object lore is unavailable for this run because the object data could not be loaded."}
                </p>
              )}
            </div>
          </section>
        </details>

        {result.celebsNote ? <p className="muted diagnostics-note">{result.celebsNote}</p> : null}

        <p className="disclaimer">{result.disclaimer}</p>
      </section>
    </main>
  );
}
