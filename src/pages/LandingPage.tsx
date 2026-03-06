import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getObjectImageCandidates } from "../lib/objectImages";
import { useQuiz } from "../state/QuizContext";
import type { LoadedAppData } from "../types";

interface LandingPageProps {
  data: LoadedAppData;
}

export function LandingPage({ data }: LandingPageProps): JSX.Element {
  const INITIAL_ROSTER_COUNT = 16;
  const ROSTER_BATCH_SIZE = 12;
  const navigate = useNavigate();
  const rosterTrackRef = useRef<HTMLDivElement | null>(null);
  const {
    answeredCount,
    isComplete,
    restartQuiz,
    selectedQuizLength,
    setQuizLength
  } = useQuiz();
  const hasInProgressAnswers = answeredCount > 0 && !isComplete;
  const objectInventory = useMemo(() => data.objectsData?.objectInventory ?? [], [data.objectsData]);
  const [visibleRosterCount, setVisibleRosterCount] = useState(INITIAL_ROSTER_COUNT);
  const typeCodeByObject = useMemo(() => {
    const mapping = new Map<string, string>();
    const byType = data.objectsData?.objectsByTypeCode;
    if (!byType) {
      return mapping;
    }

    for (const [typeCode, assignment] of Object.entries(byType)) {
      const objectKey = assignment.primary.trim().toLowerCase();
      if (!mapping.has(objectKey)) {
        mapping.set(objectKey, typeCode.toUpperCase());
      }
    }

    return mapping;
  }, [data.objectsData]);
  const visibleObjects = useMemo(
    () => objectInventory.slice(0, Math.min(visibleRosterCount, objectInventory.length)),
    [objectInventory, visibleRosterCount]
  );
  const selectedLength = selectedQuizLength ?? 30;
  const durationByLength: Record<30 | 40 | 50, string> = {
    30: "5",
    40: "7",
    50: "10"
  };
  const hasMoreRosterObjects = visibleRosterCount < objectInventory.length;

  useEffect(() => {
    setVisibleRosterCount(Math.min(INITIAL_ROSTER_COUNT, objectInventory.length));
  }, [objectInventory.length]);

  useEffect(() => {
    const track = rosterTrackRef.current;
    if (!track) {
      return;
    }

    const handleScroll = (): void => {
      if (!hasMoreRosterObjects) {
        return;
      }

      const nearEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 220;
      if (nearEnd) {
        setVisibleRosterCount((current) =>
          Math.min(objectInventory.length, current + ROSTER_BATCH_SIZE)
        );
      }
    };

    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", handleScroll);
    };
  }, [hasMoreRosterObjects, objectInventory.length]);

  return (
    <main className="screen-shell">
      <section className="card landing-card">
        <p className="eyebrow">START SCREEN</p>
        <h1>{data.resultsContent.landingTitle}</h1>

        <section className="object-carousel-shell" aria-label="Object card roster">
          <p className="object-carousel-title">Object Roster</p>
          {objectInventory.length > 0 ? (
            <>
              <div className="object-carousel-track" ref={rosterTrackRef}>
                {visibleObjects.map((objectName, index) => (
                (() => {
                  const previewTypeCode = typeCodeByObject.get(objectName.trim().toLowerCase());
                  const imageSources = getObjectImageCandidates(objectName);
                  const cardBody = (
                    <>
                      <div className="intro-object-art">
                        {/*
                          Use original full images on home screen and try
                          several filename variants so cards still render.
                        */}
                        <img
                          src={imageSources[0]}
                          alt={`${objectName} card art`}
                          loading={index < 8 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={index < 4 ? "high" : "low"}
                          onError={(event) => {
                            const candidates = imageSources;
                            const nextIndex =
                              Number(event.currentTarget.dataset.fallbackIndex ?? "0") + 1;
                            if (nextIndex < candidates.length) {
                              event.currentTarget.dataset.fallbackIndex = String(nextIndex);
                              event.currentTarget.src = candidates[nextIndex];
                              return;
                            }
                            event.currentTarget.style.visibility = "hidden";
                          }}
                        />
                      </div>
                      <p className="intro-object-name">{objectName}</p>
                    </>
                  );

                  if (!previewTypeCode) {
                    return (
                      <article className="intro-object-card" key={objectName}>
                        {cardBody}
                      </article>
                    );
                  }

                  return (
                    <button
                      className="intro-object-card intro-object-card-button"
                      type="button"
                      key={objectName}
                      onClick={() => navigate(`/results?previewType=${previewTypeCode}`)}
                    >
                      {cardBody}
                    </button>
                  );
                })()
              ))}
              </div>
              {hasMoreRosterObjects ? (
                <div className="button-row roster-load-row">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      setVisibleRosterCount((current) =>
                        Math.min(objectInventory.length, current + ROSTER_BATCH_SIZE)
                      )
                    }
                  >
                    Load More Objects
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="muted">Object roster is loading...</p>
          )}
        </section>

        <div className="landing-copy">
          <div className="landing-copy-block">
            <p className="subtitle landing-line">Welcome to the Object Alignment System.</p>
            <p className="subtitle landing-line">
              Answer a few questions and the matrices will reveal your true everyday object form.
            </p>
          </div>

          <p className="subtitle landing-meta">
            ~ {selectedLength} questions • about {durationByLength[selectedLength]} minutes
          </p>
        </div>

        <div className="length-toggle-row" role="group" aria-label="Question length selector">
          <button
            className={`length-toggle-button ${selectedLength === 30 ? "active" : ""}`}
            type="button"
            onClick={() => setQuizLength(30)}
          >
            30 Q
          </button>
          <button
            className={`length-toggle-button ${selectedLength === 40 ? "active" : ""}`}
            type="button"
            onClick={() => setQuizLength(40)}
          >
            40 Q
          </button>
          <button
            className={`length-toggle-button ${selectedLength === 50 ? "active" : ""}`}
            type="button"
            onClick={() => setQuizLength(50)}
          >
            50 Q
          </button>
        </div>

        <div className="button-row">
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setQuizLength(selectedLength);
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
