import type { FormEvent, ReactElement } from 'react';
import { Block } from '../../../common/components/Block';
import { Button } from '../../../common/components/Button/Button';
import { Heading } from '../../../common/components/Heading/Heading';
import { InputField } from '../../../common/components/InputField/InputField';
import { Link } from '../../../common/components/Link/Link';
import { Message } from '../../../common/components/Message/Message';
import { Text } from '../../../common/components/Text/Text';
import { routes } from '../../../routes';
import { LoginFormState, useLoginForm } from '../hooks/useLoginForm';
import './AuthPage.css';

interface SubmitLoginFormParams {
  event: FormEvent<HTMLFormElement>;
  submit: () => Promise<void>;
}

// Prevents browser navigation so the hook can validate and submit credentials first.
const submitLoginForm = ({ event, submit }: SubmitLoginFormParams): void => {
  event.preventDefault();
  void submit();
};

// Provides the entry route for existing users.
export function LoginPage(): ReactElement {
  const { errorMessage, identifier, password, setIdentifier, setPassword, state, submit } =
    useLoginForm();
  const isSubmitting = state === LoginFormState.Loading;

  return (
    <section aria-labelledby="login-title" className="auth-page">
      <Block>
        <Heading id="login-title" scale={1}>
          login
        </Heading>
        {errorMessage !== undefined && <Message tone="issue">{errorMessage}</Message>}
        <Text>Welcome back.</Text>
        <form
          className="auth-form"
          noValidate
          onSubmit={(event) => submitLoginForm({ event, submit })}
        >
          <InputField
            autoComplete="username"
            disabled={isSubmitting}
            id="login-identifier"
            label="email or username"
            name="identifier"
            onChange={(event) => setIdentifier(event.target.value)}
            required
            value={identifier}
          />
          <InputField
            autoComplete="current-password"
            disabled={isSubmitting}
            id="login-password"
            label="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <Button disabled={isSubmitting} type="submit" variant="active">
            {isSubmitting ? 'logging in…' : 'login'}
          </Button>
        </form>
        <Text>
          need an account? <Link to={routes.register}>register</Link>
        </Text>
      </Block>
    </section>
  );
}
