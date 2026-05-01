import type { ComponentProps } from 'react';
import { BookishIcon, type BookishIconName, type BookishIconTone } from './BookishIcon';

export type EditorialIconName =
  | 'briefing'
  | 'inbox'
  | 'chevron-diamond'
  | 'search'
  | 'refresh'
  | 'bookmark'
  | 'send'
  | 'archive'
  | 'bell'
  | 'settings'
  | 'close'
  | 'arrow-left';

const editorialIconMap: Record<EditorialIconName, BookishIconName> = {
  briefing: 'briefing',
  inbox: 'inbox',
  'chevron-diamond': 'chevron-diamond',
  search: 'search',
  refresh: 'refresh',
  bookmark: 'bookmark',
  send: 'send',
  archive: 'archive',
  bell: 'bell',
  settings: 'settings',
  close: 'close',
  'arrow-left': 'arrow-left',
};

export function EditorialIcon({
  name,
  size = 24,
  tone = 'primary',
  className = '',
  ...rest
}: {
  name: EditorialIconName;
  size?: number;
  tone?: BookishIconTone;
  className?: string;
} & ComponentProps<'span'>) {
  return (
    <BookishIcon
      name={editorialIconMap[name]}
      size={size}
      tone={tone}
      className={`editorial-icon ${className}`.trim()}
      {...rest}
    />
  );
}
