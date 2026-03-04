import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorScreen } from "./components/ErrorScreen";
import { loadAppData } from "./lib/loadData";
import { getOrderedQuestions } from "./lib/scoring";
import { LandingPage } from "./pages/LandingPage";
import { QuizPage } from "./pages/QuizPage";
import { ResultsPage } from "./pages/ResultsPage";
import { QuizProvider } from "./state/QuizContext";
import type { LoadedAppData } from "./types";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: LoadedAppData }
  | { status: "error"; message: string };

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unexpected error while loading quiz data.";
}

export function App(): JSX.Element {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "");

  const load = useCallback(async (forceReload = false) => {
    setLoadState({ status: "loading" });
    try {
      const data = await loadAppData(forceReload);
      setLoadState({ status: "ready", data });
    } catch (error) {
      setLoadState({ status: "error", message: toErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  if (loadState.status === "loading") {
    return (
      <main className="screen-shell">
        <section className="card">
          <h1>Loading Vibe-o-meter</h1>
          <p>Fetching quiz data and calibrating your highly unscientific destiny.</p>
        </section>
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <ErrorScreen
        title="Could Not Load Quiz Data"
        message={loadState.message}
        onRetry={() => {
          void load(true);
        }}
      />
    );
  }

  const orderedQuestions = getOrderedQuestions(
    loadState.data.questions,
    loadState.data.compasses.compasses
  );

  return (
    <BrowserRouter basename={routerBase}>
      <QuizProvider questions={orderedQuestions}>
        <Routes>
          <Route path="/" element={<LandingPage data={loadState.data} />} />
          <Route path="/quiz" element={<QuizPage data={loadState.data} />} />
          <Route path="/results" element={<ResultsPage data={loadState.data} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </QuizProvider>
    </BrowserRouter>
  );
}
