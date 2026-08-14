import { useMemo, useState } from "react";

import { createDesktopNoetisClient } from "./noetis-client";

const INITIAL_NOTE_TITLE = "Untitled note";

export function App(): JSX.Element {
  const noetis = useMemo(() => createDesktopNoetisClient(), []);
  const [queryStatus, setQueryStatus] = useState("Ready to query notes.");
  const [commandStatus, setCommandStatus] = useState("Ready to create a note.");

  const runInitialQuery = (): void => {
    noetis
      .runQuery({ type: "list-notes" })
      .then(() => setQueryStatus("Query submitted."))
      .catch(() => setQueryStatus("Shared query handler is not initialized yet."));
  };

  const createInitialNote = (): void => {
    noetis
      .submitCommand({ type: "create-note", title: INITIAL_NOTE_TITLE })
      .then(() => setCommandStatus("Command submitted."))
      .catch(() => setCommandStatus("Shared command handler is not initialized yet."));
  };

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="top-bar">
          <div>
            <p className="eyebrow">Noetis Desktop</p>
            <h1>Search-first notes</h1>
          </div>
          <button type="button" onClick={createInitialNote}>
            New note
          </button>
        </header>

        <div className="content-grid">
          <aside className="sidebar" aria-label="Saved queries">
            <button type="button" className="query-button" onClick={runInitialQuery}>
              All notes
            </button>
          </aside>

          <section className="note-panel" aria-label="Note workspace">
            <h2>Workspace</h2>
            <p>{queryStatus}</p>
            <p>{commandStatus}</p>
          </section>
        </div>
      </section>
    </main>
  );
}
