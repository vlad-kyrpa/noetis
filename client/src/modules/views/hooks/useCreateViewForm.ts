import { useCallback, useMemo, useState } from 'react';
import type { HttpValidationIssues } from '../../../common/api/types';
import { useModuleClient } from '../../../common/backend-client/useModuleClient';
import { parseTagsText } from '../../../common/tags/tags-text';
import { viewsClientModule } from '../api/views-client';
import { CreateViewFailureKind, CreateViewFormState, ViewType } from '../types';
import type {
  CreateViewFailure,
  CreateViewFeedback,
  CreateViewFormModel,
  UseCreateViewFormParams,
} from '../types';

const NO_ISSUES: HttpValidationIssues = {};
const NO_FEEDBACK: CreateViewFeedback = { issues: NO_ISSUES, message: null };
const DUPLICATE_TITLE_MESSAGE = 'A view with this title already exists.';
const NETWORK_MESSAGE = 'Unable to reach the server. Check your connection.';

// Decides where each failure is shown: on the title, per field, or as a form-level message.
const CREATE_VIEW_FAILURE_TO_FEEDBACK: Readonly<
  Record<CreateViewFailureKind, (failure: CreateViewFailure) => CreateViewFeedback>
> = {
  [CreateViewFailureKind.DuplicateTitle]: () => ({
    issues: { title: DUPLICATE_TITLE_MESSAGE },
    message: null,
  }),
  [CreateViewFailureKind.Invalid]: (failure) => ({
    issues: 'issues' in failure ? failure.issues : NO_ISSUES,
    message: null,
  }),
  [CreateViewFailureKind.Network]: () => ({ issues: NO_ISSUES, message: NETWORK_MESSAGE }),
  [CreateViewFailureKind.Unknown]: (failure) => ({
    issues: NO_ISSUES,
    message: 'message' in failure ? failure.message : null,
  }),
};

// Owns the create view form: values, the saved form of the tags, feedback, and submit. The
// first allowed type is the default; with one type the form never shows a picker.
export function useCreateViewForm({
  onCreated,
  types,
}: UseCreateViewFormParams): CreateViewFormModel {
  const viewsClient = useModuleClient(viewsClientModule);
  const [type, setRawType] = useState<ViewType>(types[0] ?? ViewType.Task);
  const [title, setRawTitle] = useState('');
  const [tagsText, setRawTagsText] = useState('');
  const [feedback, setFeedback] = useState<CreateViewFeedback>(NO_FEEDBACK);
  const [state, setState] = useState(CreateViewFormState.Ready);
  const tags = useMemo(() => parseTagsText(tagsText), [tagsText]);

  const setType = useCallback((nextType: ViewType): void => {
    setRawType(nextType);
    setFeedback(NO_FEEDBACK);
  }, []);

  const setTitle = useCallback((nextTitle: string): void => {
    setRawTitle(nextTitle);
    setFeedback(NO_FEEDBACK);
  }, []);

  const setTagsText = useCallback((nextTagsText: string): void => {
    setRawTagsText(nextTagsText);
    setFeedback(NO_FEEDBACK);
  }, []);

  const submit = useCallback(async (): Promise<void> => {
    setState(CreateViewFormState.Submitting);
    setFeedback(NO_FEEDBACK);
    const createResult = await viewsClient.create({ tags, title: title.trim(), type });
    setState(CreateViewFormState.Ready);

    if (createResult.ok) {
      onCreated(createResult.value);
      return;
    }

    setFeedback(CREATE_VIEW_FAILURE_TO_FEEDBACK[createResult.error.kind](createResult.error));
  }, [onCreated, tags, title, type, viewsClient]);

  return {
    feedback,
    setTagsText,
    setTitle,
    setType,
    state,
    submit,
    tags,
    types,
    values: { tagsText, title, type },
  };
}
