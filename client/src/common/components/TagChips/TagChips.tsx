import type { ReactElement } from 'react';
import type { TagChipsProps } from './types';
import './TagChips.css';

const TAG_PREFIX = '#';

// Shows tag labels as `#label` chips; renders nothing for an empty list.
export function TagChips({ tags }: TagChipsProps): ReactElement | null {
  if (tags.length === 0) {
    return null;
  }

  return (
    <ul className="tag-chips">
      {tags.map((tag) => (
        <li className="tag-chip" key={tag}>{`${TAG_PREFIX}${tag}`}</li>
      ))}
    </ul>
  );
}
