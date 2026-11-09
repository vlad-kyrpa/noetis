import type { FormEvent, ReactElement } from 'react';
import { Button } from '../../../../common/components/Button/Button';
import { ButtonVariant } from '../../../../common/components/Button/types';
import { FieldIssue } from '../../../../common/components/FieldIssue/FieldIssue';
import { InputField } from '../../../../common/components/InputField/InputField';
import { Message } from '../../../../common/components/Message/Message';
import { MessageTone } from '../../../../common/components/Message/types';
import { TagChips } from '../../../../common/components/TagChips/TagChips';
import { CreateViewFormState } from '../../types';
import { VIEW_TYPE_DEFINITIONS } from '../../view-types';
import type { CreateViewFormProps } from './types';
import './CreateViewForm.css';

const TITLE_FIELD_ID = 'create-view-title';
const TITLE_ISSUE_ID = 'create-view-title-issue';
const TAGS_FIELD_ID = 'create-view-tags';
const TAGS_ISSUE_ID = 'create-view-tags-issue';
const TYPE_PICKER_LABEL_ID = 'create-view-type-label';
const TAGS_PLACEHOLDER = 'work, urgent';
// The picker only makes sense when the owning area allows more than one type.
const MIN_TYPES_FOR_PICKER = 2;

// Renders the reusable create view fields. The type picker appears only for several types; tag
// chips preview the lower-cased labels exactly as they will be saved.
export function CreateViewForm({ form, onCancel }: CreateViewFormProps): ReactElement {
  const { feedback, setTagsText, setTitle, setType, state, submit, tags, types, values } = form;
  const isSubmitting = state === CreateViewFormState.Submitting;
  const hasTypePicker = types.length >= MIN_TYPES_FOR_PICKER;
  const titleIssue = feedback.issues.title;
  const tagsIssue = feedback.issues.tags;

  // Keeps the browser from navigating so the hook can validate and send the view.
  const submitForm = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submit();
  };

  return (
    <form className="create-view-form" noValidate onSubmit={submitForm}>
      {feedback.message !== null && <Message tone={MessageTone.Issue}>{feedback.message}</Message>}
      {hasTypePicker && (
        <div className="create-view-form-field">
          <span className="create-view-form-label" id={TYPE_PICKER_LABEL_ID}>
            type
          </span>
          <div
            aria-labelledby={TYPE_PICKER_LABEL_ID}
            className="create-view-form-types"
            role="group"
          >
            {types.map((type) => (
              <Button
                aria-pressed={type === values.type}
                disabled={isSubmitting}
                key={type}
                onClick={() => setType(type)}
                type="button"
                variant={type === values.type ? ButtonVariant.Active : ButtonVariant.Default}
              >
                {VIEW_TYPE_DEFINITIONS[type].label}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="create-view-form-field">
        <InputField
          aria-describedby={titleIssue === undefined ? undefined : TITLE_ISSUE_ID}
          aria-invalid={titleIssue !== undefined}
          disabled={isSubmitting}
          id={TITLE_FIELD_ID}
          label="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder={VIEW_TYPE_DEFINITIONS[values.type].titlePlaceholder}
          required
          value={values.title}
        />
        <FieldIssue id={TITLE_ISSUE_ID} issue={titleIssue} />
      </div>
      <div className="create-view-form-field">
        <InputField
          aria-describedby={tagsIssue === undefined ? undefined : TAGS_ISSUE_ID}
          aria-invalid={tagsIssue !== undefined}
          disabled={isSubmitting}
          id={TAGS_FIELD_ID}
          label="tags (comma-separated)"
          onChange={(event) => setTagsText(event.target.value)}
          placeholder={TAGS_PLACEHOLDER}
          value={values.tagsText}
        />
        <TagChips tags={tags} />
        <FieldIssue id={TAGS_ISSUE_ID} issue={tagsIssue} />
      </div>
      <div className="create-view-form-actions">
        <Button disabled={isSubmitting} onClick={onCancel} type="button">
          cancel
        </Button>
        <Button disabled={isSubmitting} type="submit" variant={ButtonVariant.Active}>
          {isSubmitting ? 'creating…' : 'create view'}
        </Button>
      </div>
    </form>
  );
}
