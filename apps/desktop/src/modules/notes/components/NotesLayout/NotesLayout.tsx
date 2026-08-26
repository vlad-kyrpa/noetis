import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { IconButton } from "@common/components";
import { NotesSearchModal } from "../NotesSearchModal/NotesSearchModal";
import styles from "./styles.module.css";

// Provides notes-level chrome and keeps search modal state around nested note routes.
export function NotesLayout(): JSX.Element {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  return (
    <div className={styles.layout}>
      <div className={styles.toolbar}>
        <IconButton
          ariaLabel="Create note"
          iconName="plus"
          onClick={() => navigate("/notes")}
        />
        <IconButton
          ariaLabel="Search notes"
          iconName="search"
          onClick={() => setIsSearchOpen(true)}
        />
      </div>
      <main className={styles.content}>
        <Outlet />
      </main>
      <NotesSearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  );
}
