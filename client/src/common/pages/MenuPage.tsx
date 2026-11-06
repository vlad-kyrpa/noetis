import { HeadingScale } from '../components/Heading/types';
import type { ReactElement } from 'react';
import { useAuth } from '../../modules/auth/context/useAuth';
import { Block } from '../components/Block';
import { Button } from '../components/Button/Button';
import { Heading } from '../components/Heading/Heading';
import { Text } from '../components/Text/Text';
import './MenuPage.css';

// Shows who is signed in and lets them end the session; the route guard handles the redirect.
export function MenuPage(): ReactElement {
  const { logout, user } = useAuth();

  return (
    <section aria-labelledby="menu-page-title" className="menu-page">
      <Block>
        <Heading id="menu-page-title" scale={HeadingScale.Page}>
          menu
        </Heading>
        <Text>
          signed in as <strong>{user?.username}</strong>
        </Text>
        <Button onClick={() => void logout()} type="button">
          logout
        </Button>
      </Block>
    </section>
  );
}
