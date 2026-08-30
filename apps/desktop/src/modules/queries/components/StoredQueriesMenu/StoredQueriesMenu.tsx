import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import { useNavigate } from "react-router-dom";
import {
  Button,
  ButtonType,
  ConfirmationModal,
  createIcon,
} from "@common/components";
import type { StoredQueryContainer, StoredQueryId } from "@noetis/noetis";
import {
  CategoryModal,
  type CategoryModalValue,
} from "../CategoryModal/CategoryModal";
import { StoredQueryModal } from "../StoredQueryModal/StoredQueryModal";
import { useStoredQueriesTree } from "../../hooks/useStoredQueriesTree";
import styles from "./styles.module.css";

interface StoredQueriesMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CategoryModalState {
  open: boolean;
  category?: CategoryModalValue | undefined;
}

interface StoredQueryModalState {
  open: boolean;
  containerId?: StoredQueryId | undefined;
  storedQueryId?: StoredQueryId | undefined;
}

interface RemoveCategoryState {
  open: boolean;
  category?: CategoryModalValue | undefined;
}

interface RemoveQueryState {
  open: boolean;
  storedQueryId?: StoredQueryId | undefined;
}

interface ActionMenuItem {
  text: string;
  onSelect: () => void;
  danger?: boolean | undefined;
}

const EMPTY_CATEGORY_MODAL_STATE: CategoryModalState = {
  open: false,
};

const EMPTY_STORED_QUERY_MODAL_STATE: StoredQueryModalState = {
  open: false,
};

const EMPTY_REMOVE_CATEGORY_STATE: RemoveCategoryState = {
  open: false,
};

const EMPTY_REMOVE_QUERY_STATE: RemoveQueryState = {
  open: false,
};

// Creates the small item-action dropdown used by categories and stored queries.
function ActionMenu({ items }: { items: ActionMenuItem[] }): JSX.Element {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Item actions"
          className={styles.actionTrigger}
          type="button"
        >
          {createIcon({ name: "moreVertical", alt: "Item actions" })}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className={styles.actionMenu}
          sideOffset={6}
        >
          {items.map((item) => (
            <DropdownMenu.Item
              className={
                item.danger
                  ? `${styles.actionMenuItem} ${styles.actionMenuItemDanger}`
                  : styles.actionMenuItem
              }
              key={item.text}
              onSelect={item.onSelect}
            >
              {item.text}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// Renders one category with its query rows and category-level actions.
function CategorySection({
  container,
  onAddQuery,
  onRenameCategory,
  onRemoveCategory,
  onSelectQuery,
  onUpdateQuery,
  onRemoveQuery,
}: {
  container: StoredQueryContainer;
  onAddQuery: (containerId: StoredQueryId) => void;
  onRenameCategory: (category: CategoryModalValue) => void;
  onRemoveCategory: (category: CategoryModalValue) => void;
  onSelectQuery: (storedQueryId: StoredQueryId) => void;
  onUpdateQuery: (storedQueryId: StoredQueryId) => void;
  onRemoveQuery: (storedQueryId: StoredQueryId) => void;
}): JSX.Element {
  return (
    <section className={styles.container}>
      <div className={styles.categoryHeader}>
        <span className={styles.categoryName}>{container.name}</span>
        <ActionMenu
          items={[
            {
              text: "Add query",
              onSelect: () => onAddQuery(container.id),
            },
            {
              text: "Rename category",
              onSelect: () =>
                onRenameCategory({ id: container.id, name: container.name }),
            },
            {
              text: "Remove category",
              onSelect: () =>
                onRemoveCategory({ id: container.id, name: container.name }),
              danger: true,
            },
          ]}
        />
      </div>
      <div className={styles.queryList}>
        {container.queries.map((query) => (
          <div className={styles.queryRow} key={query.id}>
            <button
              className={styles.queryItem}
              onClick={() => onSelectQuery(query.id)}
              type="button"
            >
              {query.name}
            </button>
            <ActionMenu
              items={[
                {
                  text: "Update",
                  onSelect: () => onUpdateQuery(query.id),
                },
                {
                  text: "Remove",
                  onSelect: () => onRemoveQuery(query.id),
                  danger: true,
                },
              ]}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// Renders the stored queries side drawer and coordinates item action modals.
export function StoredQueriesMenu({
  open,
  onOpenChange,
}: StoredQueriesMenuProps): JSX.Element {
  const navigate = useNavigate();
  const {
    storedQueriesTree,
    error,
    isLoading,
    isSaving,
    isDeleting,
    createContainer,
    updateContainer,
    removeContainer,
    removeQuery,
  } = useStoredQueriesTree();
  const [categoryModal, setCategoryModal] = useState<CategoryModalState>(
    EMPTY_CATEGORY_MODAL_STATE,
  );
  const [storedQueryModal, setStoredQueryModal] =
    useState<StoredQueryModalState>(EMPTY_STORED_QUERY_MODAL_STATE);
  const [removeCategory, setRemoveCategory] = useState<RemoveCategoryState>(
    EMPTY_REMOVE_CATEGORY_STATE,
  );
  const [removeStoredQuery, setRemoveStoredQuery] = useState<RemoveQueryState>(
    EMPTY_REMOVE_QUERY_STATE,
  );

  const removeSelectedCategory = async (): Promise<void> => {
    if (removeCategory.category === undefined) {
      return;
    }

    const result = await removeContainer(removeCategory.category.id);

    if (result) {
      setRemoveCategory(EMPTY_REMOVE_CATEGORY_STATE);
    }
  };

  const removeSelectedQuery = async (): Promise<void> => {
    if (removeStoredQuery.storedQueryId === undefined) {
      return;
    }

    const result = await removeQuery(removeStoredQuery.storedQueryId);

    if (result) {
      setRemoveStoredQuery(EMPTY_REMOVE_QUERY_STATE);
    }
  };

  return (
    <>
      <aside
        aria-hidden={!open}
        className={`${styles.menu} ${
          open ? styles.menuOpen : styles.menuClosed
        }`}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Stored queries</h2>
          <Button
            ariaLabel="Close stored queries"
            className={styles.closeButton}
            onClick={() => onOpenChange(false)}
            type={ButtonType.Transparent}
          >
            {createIcon({ name: "close", alt: "Close stored queries" })}
          </Button>
        </div>
        <div className={styles.body}>
          {isLoading ? (
            <div className={styles.status}>Loading queries.</div>
          ) : null}
          {error === null ? null : (
            <div className={styles.status}>{error.message}</div>
          )}
          {storedQueriesTree.map((container) => (
            <CategorySection
              container={container}
              key={container.id}
              onAddQuery={(containerId) =>
                setStoredQueryModal({ open: true, containerId })
              }
              onRemoveCategory={(category) =>
                setRemoveCategory({ open: true, category })
              }
              onRemoveQuery={(storedQueryId) =>
                setRemoveStoredQuery({ open: true, storedQueryId })
              }
              onRenameCategory={(category) =>
                setCategoryModal({ open: true, category })
              }
              onSelectQuery={(storedQueryId) => {
                navigate(`/queries/${encodeURIComponent(storedQueryId)}`);
                onOpenChange(false);
              }}
              onUpdateQuery={(storedQueryId) =>
                setStoredQueryModal({ open: true, storedQueryId })
              }
            />
          ))}
          <button
            className={styles.menuItem}
            onClick={() => setCategoryModal({ open: true })}
            type="button"
          >
            + Add category
          </button>
        </div>
      </aside>
      <CategoryModal
        category={categoryModal.category}
        isSaving={isSaving}
        onCreate={createContainer}
        onOpenChange={(modalOpen) =>
          setCategoryModal({
            open: modalOpen,
            category: categoryModal.category,
          })
        }
        onUpdate={updateContainer}
        open={categoryModal.open}
      />
      <StoredQueryModal
        containerId={storedQueryModal.containerId}
        onOpenChange={(modalOpen) =>
          setStoredQueryModal({
            ...storedQueryModal,
            open: modalOpen,
          })
        }
        open={storedQueryModal.open}
        storedQueryId={storedQueryModal.storedQueryId}
      />
      <ConfirmationModal
        cancelText="Cancel"
        confirmText={isDeleting ? "Removing..." : "Remove"}
        description="This category and its stored queries will be removed."
        onConfirm={() => void removeSelectedCategory()}
        onOpenChange={(modalOpen) =>
          setRemoveCategory({
            open: modalOpen,
            category: removeCategory.category,
          })
        }
        open={removeCategory.open}
        title="Remove category?"
      />
      <ConfirmationModal
        cancelText="Cancel"
        confirmText={isDeleting ? "Removing..." : "Remove"}
        description="This stored query will be removed from its category."
        onConfirm={() => void removeSelectedQuery()}
        onOpenChange={(modalOpen) =>
          setRemoveStoredQuery({
            open: modalOpen,
            storedQueryId: removeStoredQuery.storedQueryId,
          })
        }
        open={removeStoredQuery.open}
        title="Remove stored query?"
      />
    </>
  );
}
