import { ButtonVariant } from '../../../common/components/Button/types';
import { MessageTone } from '../../../common/components/Message/types';
import { HeadingScale } from '../../../common/components/Heading/types';
import type { FormEvent, ReactElement } from 'react';
import { Block } from '../../../common/components/Block';
import { Button } from '../../../common/components/Button/Button';
import { Heading } from '../../../common/components/Heading/Heading';
import { InputField } from '../../../common/components/InputField/InputField';
import { Link } from '../../../common/components/Link/Link';
import { Message } from '../../../common/components/Message/Message';
import { Text } from '../../../common/components/Text/Text';
import { routes } from '../../../routes';
import { RegisterFormState, useRegisterForm } from '../hooks/useRegisterForm';
import './AuthPage.css';

interface SubmitRegisterFormParams {
  event: FormEvent<HTMLFormElement>;
  submit: () => Promise<void>;
}

// Prevents browser navigation so the hook can validate and submit registration details first.
const submitRegisterForm = ({ event, submit }: SubmitRegisterFormParams): void => {
  event.preventDefault();
  void submit();
};

// Provides the entry route for users creating a new account.
export function RegisterPage(): ReactElement {
  const {
    email,
    errorMessage,
    password,
    setEmail,
    setPassword,
    setUsername,
    state,
    submit,
    username,
  } = useRegisterForm();
  const isSubmitting = state === RegisterFormState.Loading;

  return (
    <section aria-labelledby="register-title" className="auth-page">
      <Block>
        <Heading id="register-title" scale={HeadingScale.Page}>
          register
        </Heading>
        {errorMessage !== undefined && <Message tone={MessageTone.Issue}>{errorMessage}</Message>}
        <Text>Create an account to start organizing your work.</Text>
        <form
          className="auth-form"
          noValidate
          onSubmit={(event) => submitRegisterForm({ event, submit })}
        >
          <InputField
            autoComplete="username"
            disabled={isSubmitting}
            id="register-username"
            label="username"
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
          />
          <InputField
            autoComplete="email"
            disabled={isSubmitting}
            id="register-email"
            label="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <InputField
            autoComplete="new-password"
            disabled={isSubmitting}
            id="register-password"
            label="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <Button disabled={isSubmitting} type="submit" variant={ButtonVariant.Active}>
            {isSubmitting ? 'registering…' : 'register'}
          </Button>
        </form>
        <Text>
          already have an account? <Link to={routes.login}>login</Link>
        </Text>
      </Block>
    </section>
  );
}
