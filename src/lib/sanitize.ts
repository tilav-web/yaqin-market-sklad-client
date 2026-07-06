import DOMPurify from 'dompurify';

/**
 * Sanitizes admin-authored rich text (TipTap HTML) before it's rendered via
 * `dangerouslySetInnerHTML`. TipTap's output is normally well-formed, but an
 * admin account could still be compromised or an editor bug could smuggle a
 * `<script>`/`onerror`/`javascript:` payload into a saved template or
 * notification body — sanitizing at render time is cheap insurance.
 *
 * DOMPurify no-ops (returns the input unchanged) when `window` isn't present,
 * which only matters during the Next.js static export build — the call
 * sites that use this are all behind client-only interaction state, so this
 * never actually runs unsanitized in a browser.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 's', 'u', 'h1', 'h2', 'h3',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'span',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
  });
}
