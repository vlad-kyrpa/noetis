import type { ReactElement } from 'react';
import { Heading } from '../../../common/components/Heading/Heading';
import { HeadingScale } from '../../../common/components/Heading/types';
import { CreateViewForm } from '../components/CreateViewForm/CreateViewForm';
import { useCreateViewForm } from '../hooks/useCreateViewForm';
import type { CreateViewPageProps } from '../types';
import './CreateViewPage.css';

// Area-agnostic "create view" page. The owning area passes the allowed types and decides what
// happens after creating or cancelling, so notes and expenses can mount it unchanged.
export function CreateViewPage({ onCancel, onCreated, types }: CreateViewPageProps): ReactElement {
  const form = useCreateViewForm({ onCreated, types });

  return (
    <section aria-labelledby="create-view-title" className="create-view-page">
      <Heading id="create-view-title" scale={HeadingScale.Section}>
        create view
      </Heading>
      <CreateViewForm form={form} onCancel={onCancel} />
    </section>
  );
}
