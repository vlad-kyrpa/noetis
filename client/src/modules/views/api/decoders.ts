import { decodeListOf, isRecord, isStringArray } from '../../../common/api/decoders';
import type { Decoder } from '../../../common/api/types';
import { ViewType } from '../types';
import type { View } from '../types';

const VIEW_TYPES: ReadonlySet<string> = new Set(Object.values(ViewType));

// Rejects view types the client has no area for, so a view is never shown in the wrong list.
const isViewType = (value: unknown): value is ViewType =>
  typeof value === 'string' && VIEW_TYPES.has(value);

// Accepts a view only when every field the UI reads has its wire type.
export const decodeView: Decoder<View> = (value) => {
  if (!isRecord(value)) {
    return undefined;
  }

  const { id, tags, title, type } = value;
  const hasTextFields = typeof id === 'string' && typeof title === 'string';

  return hasTextFields && isStringArray(tags) && isViewType(type)
    ? { id, tags, title, type }
    : undefined;
};

export const decodeViewList: Decoder<readonly View[]> = decodeListOf(decodeView);
