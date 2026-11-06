import { useCallback, useState } from 'react';
import { useAuth } from '../context/useAuth';

export enum RegisterFormState {
  Ready,
  Error,
  Success,
  Loading,
}

interface UseRegisterFormHook {
  email: string;
  errorMessage?: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setUsername: (value: string) => void;
  state: RegisterFormState;
  submit: () => Promise<void>;
  username: string;
}

// Manages registration values, validation, and the state of the account-creation request.
export function useRegisterForm(): UseRegisterFormHook {
  const { register } = useAuth();
  const [state, setState] = useState<RegisterFormState>(RegisterFormState.Ready);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const resetIssueState = useCallback((): void => {
    setErrorMessage(undefined);
    setState(RegisterFormState.Ready);
  }, []);

  const updateUsername = useCallback(
    (value: string): void => {
      setUsername(value);
      resetIssueState();
    },
    [resetIssueState],
  );

  const updateEmail = useCallback(
    (value: string): void => {
      setEmail(value);
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
    setState(RegisterFormState.Loading);
    const result = await register({ email, password, username });

    if (result.ok) {
      setState(RegisterFormState.Success);
      return;
    }

    setErrorMessage(result.error.message);
    setState(RegisterFormState.Error);
  }, [email, password, register, username]);

  return {
    email,
    errorMessage,
    password,
    setEmail: updateEmail,
    setPassword: updatePassword,
    setUsername: updateUsername,
    state,
    submit,
    username,
  };
}
