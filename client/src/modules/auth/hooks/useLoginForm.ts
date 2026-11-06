import { useCallback, useState } from 'react';
import { useAuth } from '../context/useAuth';

export enum LoginFormState {
  Ready,
  Error,
  Success,
  Loading,
}

interface UseLoginFormHook {
  setIdentifier: (value: string) => void;
  setPassword: (value: string) => void;
  identifier: string;
  errorMessage?: string;
  password: string;
  state: LoginFormState;
  submit: () => Promise<void>;
}

// Manages login form values, validation, and the state of the session request.
export function useLoginForm(): UseLoginFormHook {
  const { login } = useAuth();
  const [state, setState] = useState<LoginFormState>(LoginFormState.Ready);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [password, setPassword] = useState<string>('');
  const [identifier, setIdentifier] = useState<string>('');

  const resetIssueState = useCallback((): void => {
    setErrorMessage(undefined);
    setState(LoginFormState.Ready);
  }, []);

  const updateIdentifier = useCallback(
    (value: string): void => {
      setIdentifier(value);
      resetIssueState();
    },
    [resetIssueState],
  );

  const updatePassword = useCallback(
    (value: string): void => {
      setPassword(value);
      resetIssueState();
    },
    [resetIssueState],
  );

  const submit = useCallback(async (): Promise<void> => {
    setErrorMessage(undefined);
    setState(LoginFormState.Loading);
    const result = await login({ identifier, password });

    if (result.ok) {
      setState(LoginFormState.Success);
      return;
    }

    setErrorMessage(result.error.message);
    setState(LoginFormState.Error);
  }, [identifier, login, password]);

  return {
    state,
    errorMessage,
    identifier,
    password,
    submit,
    setIdentifier: updateIdentifier,
    setPassword: updatePassword,
  };
}
