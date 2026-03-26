import React from 'react';
import './GameNote.css';

function sanitizeNoteHtml(input: string): string {
  if (!input.trim()) return '';

  // Lightweight protection (no dependencies):
  // - remove <script> blocks
  // - remove inline event handlers (on*)
  // - normalize/secure <a> tags (http/https only; target+rel)
  const template = document.createElement('template');
  template.innerHTML = input;

  template.content.querySelectorAll('script').forEach(n => n.remove());

  const all = Array.from(template.content.querySelectorAll('*')) as HTMLElement[];
  for (const el of all) {
    // Remove inline event handlers like onclick/onerror/etc.
    for (const attr of Array.from(el.attributes)) {
      if (/^on/i.test(attr.name)) {
        el.removeAttribute(attr.name);
      }
    }

    if (el.tagName === 'A') {
      const a = el as HTMLAnchorElement;
      const href = a.getAttribute('href') ?? '';
      try {
        const url = new URL(href, window.location.href);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          a.removeAttribute('href');
        } else {
          a.setAttribute('href', url.toString());
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noreferrer noopener');
        }
      } catch {
        a.removeAttribute('href');
      }
    }
  }

  return template.innerHTML;
}

export interface GameNoteProps {
  html: string;
  label?: string;
  className?: string;
}

export const GameNote: React.FC<GameNoteProps> = ({ html, label = 'Note', className }) => {
  const sanitized = React.useMemo(() => {
    if (typeof document === 'undefined') return html;
    return sanitizeNoteHtml(html);
  }, [html]);

  if (!sanitized.trim()) return null;

  return (
    <div className={['game-note', className].filter(Boolean).join(' ')} role="note" aria-label="Game note">
      <span className="game-note-label">{label}</span>
      <div className="game-note-content" dangerouslySetInnerHTML={{ __html: sanitized }} />
    </div>
  );
};

