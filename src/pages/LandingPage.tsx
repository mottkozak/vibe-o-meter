import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../state/QuizContext";
import type { LoadedAppData } from "../types";

interface LandingPageProps {
  data: LoadedAppData;
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

export function LandingPage({ data }: LandingPageProps): JSX.Element {
  const navigate = useNavigate();
  const {
    answeredCount,
    isComplete,
    restartQuiz,
    selectedQuizLength,
    setQuizLength
  } = useQuiz();
  const hasInProgressAnswers = answeredCount > 0 && !isComplete;
  const objectInventory = useMemo(() => data.objectsData?.objectInventory ?? [], [data.objectsData]);

  return (
    <main className="screen-shell">
      <section className="card landing-card">
        <p className="eyebrow">START SCREEN</p>
        <h1>{data.resultsContent.landingTitle}</h1>
        <div className="landing-copy">
          <div className="landing-copy-block">
            <p className="subtitle landing-line">Welcome to the Object Alignment System.</p>
            <p className="subtitle landing-line">
              Answer a few questions and the matrices will reveal your true everyday object form.
            </p>
          </div>

          <p className="subtitle landing-meta">~ 30 questions • about 2 minutes</p>
        </div>

        <section className="object-carousel-shell" aria-label="Object card roster">
          <p className="object-carousel-title">Object Roster</p>
          {objectInventory.length > 0 ? (
            <div className="object-carousel-track">
              {objectInventory.map((objectName) => (
                <article className="intro-object-card" key={objectName}>
                  <div className="intro-object-art">
                    <img
                      src={getObjectImageSrc(objectName)}
                      alt={`${objectName} card art`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <p className="intro-object-name">{objectName}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">Object roster is loading...</p>
          )}
        </section>

        <div className="button-row">
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setQuizLength(30);
              navigate("/quiz");
            }}
          >
            Begin
          </button>
        </div>
        {hasInProgressAnswers && selectedQuizLength ? (
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={() => navigate("/quiz")}>
              Continue Current Quiz ({selectedQuizLength})
            </button>
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
        ) : null}
      </section>
    </main>
  );
}
