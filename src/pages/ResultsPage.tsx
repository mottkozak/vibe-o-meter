import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompassMiniChart } from "../components/CompassMiniChart";
import { generateResult } from "../lib/resultGenerator";
import { useQuiz } from "../state/QuizContext";
import type { GeneratedResult, LoadedAppData } from "../types";

interface ResultsPageProps {
  data: LoadedAppData;
}

const COMPASS_GRID_INFO: Record<
  string,
  {
    descriptor: string;
    axisLineX: string;
    axisLineY: string;
    bullets: Array<{ label: string; text: string }>;
  }
> = {
  power: {
    descriptor: "Physical vs Mental | Honorable vs Chaotic",
    axisLineX: "Viking <-> Wizard",
    axisLineY: "Hero <-> Goblin",
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
    axisLineX: "Knight <-> Pirate",
    axisLineY: "General <-> Jester",
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
    axisLineX: "Samurai <-> Cowboy",
    axisLineY: "Sensei <-> Trickster",
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
    axisLineX: "Princess <-> Tomboy",
    axisLineY: "Queen <-> Rogue",
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
    axisLineX: "Gladiator <-> Philosopher",
    axisLineY: "Monk <-> Gambler",
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

const COMPASS_PROFILE_BLURB: Record<string, string> = {
  "power.vikingHero": "You lead with direct action and protective energy.",
  "power.wizardHero": "You think fast and adapt even faster.",
  "power.vikingGoblin": "Bold instincts and chaos momentum fuel your style.",
  "power.wizardGoblin": "Clever pivots and tactical mischief are your edge.",
  "order.knightCommander": "You build structure and keep missions coherent.",
  "order.pirateCaptain": "You bend systems when freedom gets better outcomes.",
  "order.knightJester": "You balance responsibility with morale and humor.",
  "order.pirateJester": "You break rules and weaponize humor.",
  "discipline.samuraiMaster": "Precision and consistency are your default power.",
  "discipline.cowboySage": "Independent, practical, and grounded in real-world learning.",
  "discipline.samuraiTrickster": "Disciplined creativity with strategic rule-bending.",
  "discipline.cowboyTrickster": "Independent, creative, unpredictable.",
  "social.royalDiplomat": "You navigate social systems with polish and tact.",
  "social.warriorQueen": "Command presence with practical, grounded leadership.",
  "social.roguePrincess": "Charismatic influence with playful strategic flair.",
  "social.rogueAdventurer": "Charismatic chaos agent.",
  "risk.gladiatorMonk": "Courage under pressure with calm emotional control.",
  "risk.philosopherMonk": "Calculated reflection before decisive movement.",
  "risk.gladiatorGambler": "Risk-forward action with relentless momentum.",
  "risk.philosopherGambler": "Calculated risk with clever instincts."
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

export function ResultsPage({ data }: ResultsPageProps): JSX.Element {
  const navigate = useNavigate();
  const { axisScores, isComplete, restartQuiz, questions, selectedQuizLength } = useQuiz();
  const [actionStatus, setActionStatus] = useState<string | null>(null);
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
  const cardCelebs = (result.celebs.length > 0 ? result.celebs : ["No famous vibe buddies listed."]).slice(
    0,
    5
  );

  const primaryObject = result.householdArchetype?.primaryObject ?? "Unknown";
  const backupObject = result.householdArchetype?.backupObject ?? "Unknown";
  const primaryReason =
    result.householdArchetype?.primaryReason ?? "Reliable utility with surprising personality.";
  const backupReason =
    result.householdArchetype?.backupReason ?? "Adaptive sidekick energy for fast pivots.";

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
        <div className="results-head">
          <div>
            <p className="eyebrow">RESULTS_VIEWER.EXE</p>
            <h1>{result.archetypeTitle}</h1>
            <p className="code-pill">TYPE: {result.typeCode}</p>
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

        <h2 className="results-tier-title">Shareable Trading Card</h2>
        <section ref={shareCardRef} className="shareable-card" aria-label="Shareable results card">
          <header className="shareable-card-header window-titlebar">
            <p className="shareable-titlebar-label">RESULTS_VIEWER.EXE</p>
          </header>

          <div className="shareable-card-content">
            <header className="shareable-card-meta">
              <h2>{result.archetypeTitle}</h2>
              <p className="code-pill">TYPE: {result.typeCode}</p>
            </header>

            <div className="shareable-top-grid">
              <div className="shareable-object-image" aria-label={`Primary object ${primaryObject}`}>
                <p className="object-image-label">OBJECT_IMAGE.BMP</p>
                <div className="object-glyph">{getObjectGlyph(primaryObject)}</div>
                <p className="object-name">{primaryObject}</p>
                <p className="muted object-caption">Primary Object</p>
              </div>
              <div className="shareable-trait-columns">
                <div>
                  <h3>Strengths</h3>
                  <ul>
                    {cardStrengths.map((strength) => (
                      <li key={strength}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Weaknesses</h3>
                  <ul>
                    {cardWeaknesses.map((watchout) => (
                      <li key={watchout}>{watchout}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <section className="shareable-block">
              <h3>Compass Profile</h3>
              <ul className="inline-list">
                {result.compassBreakdown.map((item) => {
                  const key = `${item.compass.id}.${item.quadrant.id}`;
                  const blurb = COMPASS_PROFILE_BLURB[key] ?? "Unique alignment pattern.";
                  return (
                    <li key={key}>
                      <strong>
                        {item.compass.name}: {item.quadrant.label}
                      </strong>
                      <span> - {blurb}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="shareable-block">
              <h3>Hidden Talents</h3>
              {result.householdArchetype ? (
                <div className="hidden-talents-grid">
                  <div>
                    <p className="talent-label">Primary Object Power</p>
                    <p>
                      <strong>{primaryObject}</strong>
                    </p>
                    <p>{primaryReason}</p>
                  </div>
                  <div>
                    <p className="talent-label">Backup Object Power</p>
                    <p>
                      <strong>{backupObject}</strong>
                    </p>
                    <p>{backupReason}</p>
                  </div>
                </div>
              ) : (
                <p className="muted">
                  {result.householdArchetypeMessage ??
                    "Object power data is unavailable for this run, but the main diagnostics still work."}
                </p>
              )}
            </section>

            <section className="shareable-block">
              <h3>Famous Vibe Buddies</h3>
              <ul>
                {cardCelebs.map((celeb) => (
                  <li key={celeb}>{celeb}</li>
                ))}
              </ul>
            </section>
          </div>
        </section>

        <div className="button-row results-actions">
          <button className="primary-button" type="button" onClick={handleDownloadCard}>
            Download Card
          </button>
          <button className="secondary-button" type="button" onClick={() => void handleCopyLink()}>
            Copy Result Link
          </button>
          <button className="secondary-button" type="button" onClick={() => void handleShare()}>
            Share With Friends
          </button>
        </div>
        {actionStatus ? <p className="muted action-status">{actionStatus}</p> : null}

        <hr className="results-divider" />

        <section className="detailed-section">
          <h2>Full Personality Diagnostics</h2>

          <h3>Detailed Vibe Analysis</h3>
          <p>{result.summary}</p>
          <p className="one-liner">{result.powerOneLiner}</p>

          <h3>Compass Charts</h3>
          <div className="chart-grid-layout">
            {result.compassBreakdown.map((item) => (
              <CompassMiniChart
                key={item.compass.id}
                title={item.compass.name}
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

          <h3>Strengths (Expanded)</h3>
          <ul>
            {result.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>

          <h3>Weaknesses (Expanded)</h3>
          <ul>
            {result.watchouts.map((watchout) => (
              <li key={watchout}>{watchout}</li>
            ))}
          </ul>

          <h3>Field Dossier</h3>
          <p>
            Type code <strong>{result.typeCode}</strong> resolves to the object pair <strong>{primaryObject}</strong>
            {" / "}
            <strong>{backupObject}</strong>, with compass profile details above.
          </p>

          <h3>Object Lore</h3>
          {result.householdArchetype ? (
            <>
              <p>
                <strong>{primaryObject}:</strong> {primaryReason}
              </p>
              <p>
                <strong>{backupObject}:</strong> {backupReason}
              </p>
            </>
          ) : (
            <p className="muted">
              {result.householdArchetypeMessage ??
                "Object lore is unavailable for this run because the object data could not be loaded."}
            </p>
          )}

          <h3>Famous Comparisons</h3>
          <ul>
            {result.celebs.map((celeb) => (
              <li key={celeb}>{celeb}</li>
            ))}
          </ul>
          {result.celebsNote ? <p className="muted">{result.celebsNote}</p> : null}
        </section>

        <p className="disclaimer">{result.disclaimer}</p>
      </section>
    </main>
  );
}
