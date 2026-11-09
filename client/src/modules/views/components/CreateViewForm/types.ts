import type { CreateViewFormModel } from '../../types';

export interface CreateViewFormProps {
  readonly form: CreateViewFormModel;
  readonly onCancel: () => void;
}
