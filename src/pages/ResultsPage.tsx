import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CompassMiniChart } from "../components/CompassMiniChart";
import { generateResult } from "../lib/resultGenerator";
import { useQuiz } from "../state/QuizContext";
import type { GeneratedResult, LoadedAppData } from "../types";

interface ResultsPageProps {
  data: LoadedAppData;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unexpected error while generating results.";
}

export function ResultsPage({ data }: ResultsPageProps): JSX.Element {
  const navigate = useNavigate();
  const { axisScores, isComplete, restartQuiz } = useQuiz();

  const resultState = useMemo<{ result: GeneratedResult | null; error: string | null }>(() => {
    if (!isComplete) {
      return {
        result: null,
        error: null
      };
    }

    try {
      return {
        result: generateResult(data, axisScores),
        error: null
      };
    } catch (error) {
      return {
        result: null,
        error: toErrorMessage(error)
      };
    }
  }, [axisScores, data, isComplete]);

  if (!isComplete) {
    return (
      <main className="screen-shell">
        <section className="card">
          <h1>Results Locked</h1>
          <p>Finish all 30 questions before opening your archetype results.</p>
          <div className="button-row">
            <button className="primary-button" type="button" onClick={() => navigate("/quiz")}> 
              Return to Quiz
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
          <h1>Could Not Generate Results</h1>
          <p>{resultState.error ?? "No result data available."}</p>
          <div className="button-row">
            <button className="primary-button" type="button" onClick={() => navigate("/quiz")}> 
              Back to Quiz
            </button>
          </div>
        </section>
      </main>
    );
  }

  const result = resultState.result;

  return (
    <main className="screen-shell">
      <section className="card results-card">
        <div className="results-head">
          <div>
            <p className="eyebrow">{data.resultsContent.resultsHeading}</p>
            <h1>{result.archetypeTitle}</h1>
            <p className="code-pill">{result.typeCode}</p>
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

        <section className="household-section">
          <h2>Your Household Archetype</h2>
          {result.householdArchetype ? (
            <>
              <p>
                <strong>Primary Object:</strong>{" "}
                <strong>{result.householdArchetype.primaryObject}</strong>
              </p>
              <p>
                <strong>Backup Object:</strong>{" "}
                <strong>{result.householdArchetype.backupObject}</strong>
              </p>
              <p>{result.householdArchetype.why}</p>
            </>
          ) : (
            <p className="muted object-note">
              {result.householdArchetypeMessage ??
                "Household archetype is unavailable for this result."}
            </p>
          )}
        </section>

        <p className="one-liner">{result.powerOneLiner}</p>

        <p>{result.summary}</p>

        <h2>Compass Quadrants</h2>
        <ul className="inline-list">
          {result.compassBreakdown.map((item) => (
            <li key={item.compass.id}>
              <strong>{item.compass.name}:</strong> {item.quadrant.label}
            </li>
          ))}
        </ul>

        <h2>Strengths</h2>
        <ul>
          {result.strengths.map((strength) => (
            <li key={strength}>{strength}</li>
          ))}
        </ul>

        <h2>Watchouts</h2>
        <ul>
          {result.watchouts.map((watchout) => (
            <li key={watchout}>{watchout}</li>
          ))}
        </ul>

        <h2>Famous Vibe Matches</h2>
        <ul>
          {result.celebs.map((celeb) => (
            <li key={celeb}>{celeb}</li>
          ))}
        </ul>

        <h2>Compass Charts</h2>
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
            />
          ))}
        </div>

        <p className="disclaimer">{result.disclaimer}</p>
      </section>
    </main>
  );
}
