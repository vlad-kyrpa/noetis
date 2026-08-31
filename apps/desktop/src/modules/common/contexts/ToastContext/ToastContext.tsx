import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Toast } from "radix-ui";
import styles from "./styles.module.css";

export type ToastType = "success" | "error" | "info";

export type PushToastParams = {
  type: ToastType;
  text: string;
  timer?: number | undefined;
};

type ToastRecord = {
  id: string;
  type: ToastType;
  text: string;
  timer: number;
};

type ToastContextValue = {
  pushToast: (toast: PushToastParams) => void;
};

type ToastProviderProps = {
  children: ReactNode;
};

const DEFAULT_TOAST_TIMER_MS = 3600;
const TOAST_SWIPE_DIRECTION = "right";

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Creates a stable-enough UI id for local transient toast state.
function createToastId(): string {
  return `${Date.now().toString()}-${crypto.randomUUID()}`;
}

// Prepares a toast record with a default timer for callers that omit one.
function createToastRecord(toast: PushToastParams): ToastRecord {
  return {
    id: createToastId(),
    type: toast.type,
    text: toast.text,
    timer: toast.timer ?? DEFAULT_TOAST_TIMER_MS,
  };
}

// Owns app-level toast state and renders the single Radix viewport.
export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<readonly ToastRecord[]>([]);

  const pushToast = useCallback((toast: PushToastParams): void => {
    setToasts((current) => [...current, createToastRecord(toast)]);
  }, []);

  const removeToast = useCallback((id: string): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast }}>
      <Toast.Provider swipeDirection={TOAST_SWIPE_DIRECTION}>
        {children}
        {toasts.map((toast) => (
          <Toast.Root
            className={styles.toast}
            data-type={toast.type}
            duration={toast.timer}
            key={toast.id}
            onOpenChange={(open) => {
              if (!open) {
                removeToast(toast.id);
              }
            }}
          >
            <Toast.Description className={styles.text}>
              {toast.text}
            </Toast.Description>
          </Toast.Root>
        ))}
        <Toast.Viewport className={styles.viewport} />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

// Reads the toast dispatcher and fails fast when used outside the provider.
export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);

  if (value === undefined) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return value;
}
