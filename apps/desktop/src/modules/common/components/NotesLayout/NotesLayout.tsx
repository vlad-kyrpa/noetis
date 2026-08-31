import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { IconButton } from "@common/components";
import { NotesSearchModal } from "../../../notes/components/NotesSearchModal/NotesSearchModal";
import { StoredQueriesMenu } from "../../../queries/components/StoredQueriesMenu/StoredQueriesMenu";
import styles from "./styles.module.css";

// Provides notes-level chrome and keeps search modal state around nested note routes.
export function NotesLayout(): JSX.Element {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  return (
    <div className={styles.layout}>
      <div className={styles.toolbar}>
        <IconButton
          ariaLabel="Open menu"
          iconName="menu"
          onClick={() => setIsMenuOpen((current) => !current)}
        />
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
      <StoredQueriesMenu onOpenChange={setIsMenuOpen} open={isMenuOpen} />
      <main className={styles.content}>
        <Outlet />
      </main>
      <NotesSearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  );
}
