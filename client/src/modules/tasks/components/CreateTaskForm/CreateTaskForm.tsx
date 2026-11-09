import type { FormEvent, ReactElement } from 'react';
import { Button } from '../../../../common/components/Button/Button';
import { ButtonVariant } from '../../../../common/components/Button/types';
import { FieldIssue } from '../../../../common/components/FieldIssue/FieldIssue';
import { InputField } from '../../../../common/components/InputField/InputField';
import { Message } from '../../../../common/components/Message/Message';
import { MessageTone } from '../../../../common/components/Message/types';
import { TagChips } from '../../../../common/components/TagChips/TagChips';
import { CreateTaskFormState } from '../../types';
import type { CreateTaskFormProps } from './types';
import './CreateTaskForm.css';

const TITLE_FIELD_ID = 'create-task-title';
const TITLE_ISSUE_ID = 'create-task-title-issue';
const TAGS_FIELD_ID = 'create-task-tags';
const TAGS_ISSUE_ID = 'create-task-tags-issue';
const DUE_FIELD_ID = 'create-task-due';
const DUE_ISSUE_ID = 'create-task-due-issue';

// Renders the quick create task fields: title, tags (previewed as saved) and due date.
export function CreateTaskForm({ form, onCancel }: CreateTaskFormProps): ReactElement {
  const { feedback, setDueTo, setTagsText, setTitle, state, submit, tags, values } = form;
  const isSubmitting = state === CreateTaskFormState.Submitting;
  const { dueTo: dueIssue, tags: tagsIssue, title: titleIssue } = feedback.issues;

  // Keeps the browser from navigating so the hook can validate and send the task.
  const submitForm = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submit();
  };

  return (
    <form className="create-task-form" noValidate onSubmit={submitForm}>
      {feedback.message !== null && <Message tone={MessageTone.Issue}>{feedback.message}</Message>}
      <div className="create-task-form-field">
        <InputField
          aria-describedby={titleIssue === undefined ? undefined : TITLE_ISSUE_ID}
          aria-invalid={titleIssue !== undefined}
          autoFocus
          disabled={isSubmitting}
          id={TITLE_FIELD_ID}
          label="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Review the release plan"
          required
          value={values.title}
        />
        <FieldIssue id={TITLE_ISSUE_ID} issue={titleIssue} />
      </div>
      <div className="create-task-form-field">
        <InputField
          aria-describedby={tagsIssue === undefined ? undefined : TAGS_ISSUE_ID}
          aria-invalid={tagsIssue !== undefined}
          disabled={isSubmitting}
          id={TAGS_FIELD_ID}
          label="tags (comma-separated)"
          onChange={(event) => setTagsText(event.target.value)}
          placeholder="work, urgent"
          value={values.tagsText}
        />
        <TagChips tags={tags} />
        <FieldIssue id={TAGS_ISSUE_ID} issue={tagsIssue} />
      </div>
      <div className="create-task-form-field">
        <InputField
          aria-describedby={dueIssue === undefined ? undefined : DUE_ISSUE_ID}
          aria-invalid={dueIssue !== undefined}
          disabled={isSubmitting}
          id={DUE_FIELD_ID}
          label="due date"
          onChange={(event) => setDueTo(event.target.value)}
          type="date"
          value={values.dueTo}
        />
        <FieldIssue id={DUE_ISSUE_ID} issue={dueIssue} />
      </div>
      <div className="create-task-form-actions">
        <Button disabled={isSubmitting} onClick={onCancel} type="button">
          cancel
        </Button>
        <Button disabled={isSubmitting} type="submit" variant={ButtonVariant.Active}>
          {isSubmitting ? 'creating…' : 'create task'}
        </Button>
      </div>
    </form>
  );
}
