import type { CreateTaskFormModel } from '../../types';

export interface CreateTaskFormProps {
  readonly form: CreateTaskFormModel;
  readonly onCancel: () => void;
}
