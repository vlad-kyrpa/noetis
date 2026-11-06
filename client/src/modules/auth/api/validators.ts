import type { HttpValidationIssues } from '../../../common/api/types';
import type { LoginInput, RefreshInput, RegisterInput } from '../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINIMUM_PASSWORD_LENGTH = 8;

// Validates login credentials before the HTTP utility is allowed to send them.
export const validateLoginInput = ({ identifier, password }: LoginInput): HttpValidationIssues => ({
  ...(identifier.trim() === '' ? { identifier: 'Enter your email or username.' } : {}),
  ...(password === '' ? { password: 'Enter your password.' } : {}),
});

// Validates registration input before the HTTP utility is allowed to send it.
export const validateRegisterInput = ({
  email,
  password,
  username,
}: RegisterInput): HttpValidationIssues => ({
  ...(username.trim() === '' ? { username: 'Enter a username.' } : {}),
  ...(EMAIL_PATTERN.test(email.trim()) ? {} : { email: 'Enter a valid email address.' }),
  ...(password.length < MINIMUM_PASSWORD_LENGTH
    ? { password: `Use at least ${MINIMUM_PASSWORD_LENGTH} characters for your password.` }
    : {}),
});

// Stops refresh and logout calls from sending an empty token the backend would reject anyway.
export const validateRefreshInput = ({ refreshToken }: RefreshInput): HttpValidationIssues =>
  refreshToken === '' ? { refreshToken: 'Refresh token is required.' } : {};
