import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { CoreEngine } from "@noetis/noetis";
import { createDesktopCoreEngine } from "../../../storage";

type CoreContextValue = {
  core: CoreEngine;
};

type CoreProviderProps = {
  children: ReactNode;
};

const CoreContext = createContext<CoreContextValue | undefined>(undefined);

// Initializes the main engine once for the React tree and exposes it through context.
export function CoreProvider({ children }: CoreProviderProps): JSX.Element {
  const value = useMemo<CoreContextValue>(
    () => ({
      core: createDesktopCoreEngine(),
    }),
    [],
  );

  return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>;
}

// Reads the engine context and fails fast when a component is outside the provider.
export function useCoreContext(): CoreContextValue {
  const value = useContext(CoreContext);

  if (value === undefined) {
    throw new Error("useCoreContext must be used inside CoreProvider.");
  }

  return value;
}
