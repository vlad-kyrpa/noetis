import type { FormEvent, ReactElement } from 'react';
import { Button } from '../../../../common/components/Button/Button';
import { ButtonVariant } from '../../../../common/components/Button/types';
import { FieldIssue } from '../../../../common/components/FieldIssue/FieldIssue';
import { InputField } from '../../../../common/components/InputField/InputField';
import { Message } from '../../../../common/components/Message/Message';
import { MessageTone } from '../../../../common/components/Message/types';
import { TagChips } from '../../../../common/components/TagChips/TagChips';
import { TextAreaField } from '../../../../common/components/TextAreaField/TextAreaField';
import { formatTimestamp } from '../../../../common/regional/format-date';
import { useRegional } from '../../../../common/regional/useRegional';
import { useTaskEditForm } from '../../hooks/useTaskEditForm';
import { TaskEditFormState, TaskStatus } from '../../types';
import { PanelHeader } from '../PanelHeader/PanelHeader';
import { TaskStatusMarker } from '../TaskStatusMarker/TaskStatusMarker';
import type { TaskEditorProps, TaskEditorSaveButtonProps, TaskTimestampsProps } from './types';
import './TaskEditor.css';

const TASK_STATUSES: readonly TaskStatus[] = Object.values(TaskStatus);
const TITLE_FIELD_ID = 'task-editor-title';
const TITLE_ISSUE_ID = 'task-editor-title-issue';
const DESCRIPTION_FIELD_ID = 'task-editor-description';
const STATUS_LABEL_ID = 'task-editor-status-label';
const TAGS_FIELD_ID = 'task-editor-tags';
const TAGS_ISSUE_ID = 'task-editor-tags-issue';
const DUE_FIELD_ID = 'task-editor-due';
const DUE_ISSUE_ID = 'task-editor-due-issue';

// Read-only created/updated times in the regional time zone.
function TaskTimestamps({ task }: TaskTimestampsProps): ReactElement {
  const { settings } = useRegional();
  const { locale, timeZone } = settings;

  return (
    <dl className="task-editor-timestamps">
      <div className="task-editor-timestamp">
        <dt>created</dt>
        <dd>
          <time dateTime={task.createdAt}>
            {formatTimestamp({ locale, timeZone, timestamp: task.createdAt })}
          </time>
        </dd>
      </div>
      <div className="task-editor-timestamp">
        <dt>updated</dt>
        <dd>
          <time dateTime={task.updatedAt}>
            {formatTimestamp({ locale, timeZone, timestamp: task.updatedAt })}
          </time>
        </dd>
      </div>
    </dl>
  );
}

// Save, shown next to the title only once something differs from the saved task.
function TaskEditorSaveButton({
  isDirty,
  isSaving,
}: TaskEditorSaveButtonProps): ReactElement | null {
  return isDirty ? (
    <Button disabled={isSaving} type="submit" variant={ButtonVariant.Active}>
      {isSaving ? 'saving…' : 'save'}
    </Button>
  ) : null;
}

// The task as an always-editable page. The top line (back · title · save) stays pinned
// while scrolling a long description; Enter in a single-line field saves too.
export function TaskEditor({ backTo, onSaved, task }: TaskEditorProps): ReactElement {
  const { draft, feedback, isDirty, save, state, tags, updateDraft } = useTaskEditForm({
    onSaved,
    task,
  });
  const isSaving = state === TaskEditFormState.Saving;
  const { dueTo: dueIssue, tags: tagsIssue, title: titleIssue } = feedback.issues;

  // Keeps the browser from navigating; an unchanged form has nothing to save.
  const submitForm = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (isDirty && !isSaving) {
      void save();
    }
  };

  const titleField = (
    <div className="task-editor-title">
      <label className="visually-hidden" htmlFor={TITLE_FIELD_ID}>
        title
      </label>
      <input
        aria-describedby={titleIssue === undefined ? undefined : TITLE_ISSUE_ID}
        aria-invalid={titleIssue !== undefined}
        className="task-editor-title-input"
        disabled={isSaving}
        id={TITLE_FIELD_ID}
        onChange={(event) => updateDraft({ title: event.target.value })}
        placeholder="task title"
        required
        value={draft.title}
      />
      <FieldIssue id={TITLE_ISSUE_ID} issue={titleIssue} />
    </div>
  );

  return (
    <form className="task-editor" noValidate onSubmit={submitForm}>
      <PanelHeader
        actions={<TaskEditorSaveButton isDirty={isDirty} isSaving={isSaving} />}
        backTo={backTo}
        search={null}
        title={titleField}
      />
      <div className="task-editor-body">
        {feedback.message !== null && (
          <Message tone={MessageTone.Issue}>{feedback.message}</Message>
        )}
        <div className="task-editor-description">
          <TextAreaField
            disabled={isSaving}
            id={DESCRIPTION_FIELD_ID}
            label="description"
            onChange={(event) => updateDraft({ description: event.target.value })}
            placeholder="write down all the context: details, links, acceptance criteria, next steps"
            value={draft.description}
          />
        </div>
        <div className="task-editor-meta">
          <div className="task-editor-field">
            <span className="task-editor-label" id={STATUS_LABEL_ID}>
              status
            </span>
            <div aria-labelledby={STATUS_LABEL_ID} className="task-editor-statuses" role="group">
              {TASK_STATUSES.map((status) => (
                <Button
                  aria-pressed={status === draft.status}
                  disabled={isSaving}
                  key={status}
                  onClick={() => updateDraft({ status })}
                  type="button"
                  variant={status === draft.status ? ButtonVariant.Active : ButtonVariant.Default}
                >
                  <TaskStatusMarker isLabelShown status={status} />
                </Button>
              ))}
            </div>
          </div>
          <div className="task-editor-field">
            <InputField
              aria-describedby={tagsIssue === undefined ? undefined : TAGS_ISSUE_ID}
              aria-invalid={tagsIssue !== undefined}
              disabled={isSaving}
              id={TAGS_FIELD_ID}
              label="tags (comma-separated)"
              onChange={(event) => updateDraft({ tagsText: event.target.value })}
              placeholder="work, urgent"
              value={draft.tagsText}
            />
            <TagChips tags={tags} />
            <FieldIssue id={TAGS_ISSUE_ID} issue={tagsIssue} />
          </div>
          <div className="task-editor-field">
            <InputField
              aria-describedby={dueIssue === undefined ? undefined : DUE_ISSUE_ID}
              aria-invalid={dueIssue !== undefined}
              disabled={isSaving}
              id={DUE_FIELD_ID}
              label="due date"
              onChange={(event) => updateDraft({ dueTo: event.target.value })}
              type="date"
              value={draft.dueTo}
            />
            <FieldIssue id={DUE_ISSUE_ID} issue={dueIssue} />
          </div>
        </div>
        <TaskTimestamps task={task} />
      </div>
    </form>
  );
}
