/**
 * Safe markdown renderer — HTML-escape first, then convert markdown to HTML.
 * This prevents XSS by ensuring user/LLM content cannot inject raw HTML.
 * Only our markdown conversion creates HTML tags.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Lightweight markdown → HTML with eral-* CSS classes (no external deps)
export function safeMarkdown(raw: string): string {
  if (!raw) return '';

  // 1. Escape HTML entities first
  let html = escapeHtml(raw);

  // 2. Code blocks (``` ... ```) — must come before inline code
  html = html.replace(/```([a-z]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="eral-code-block" data-lang="${lang || 'text'}"><code>${code.trim()}</code></pre>`;
  });

  // 3. Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="eral-inline-code">$1</code>');

  // 4. Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 5. Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 6. Strikethrough
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // 7. Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="eral-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="eral-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="eral-h1">$1</h1>');

  // 8. Unordered lists
  html = html.replace(/^[-*+] (.+)$/gm, '<li class="eral-li">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="eral-ul">${match}</ul>`);

  // 9. Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="eral-li eral-oli">$1</li>');

  // 10. Blockquotes (matched after > was escaped to &gt;)
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="eral-blockquote">$1</blockquote>');

  // 11. Horizontal rule
  html = html.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, '<hr class="eral-hr"/>');

  // 12. Line breaks — double newline = paragraph break
  html = html.replace(/\n\n+/g, '</p><p class="eral-p">');
  html = `<p class="eral-p">${html}</p>`;

  // 13. Single newlines → <br> (but not inside block elements)
  html = html.replace(/([^>])\n([^<])/g, '$1<br/>$2');

  // 14. Clean up empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');

  return html;
}

const DANGEROUS_PATTERNS = [
  /on\w+\s*=/gi,        // onclick=, onload=, etc.
  /javascript:/gi,       // javascript: URIs
  /vbscript:/gi,        // vbscript: URIs
  /<script[\s\S]*?<\/script>/gi,
  /<style[\s\S]*?<\/style>/gi,
  /data:text\/html/gi,
];

export function safeMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Fenced code blocks: ```lang\ncode\n```
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_: string, lang: string, code: string) =>
      `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`
    )
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold: **text** or __text__
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // Headers: ### text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Unordered lists
    .replace(/^[\-\*\+] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((<li>[^<]*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Horizontal rule
    .replace(/^---+$/gm, '<hr>')
    // Line breaks / paragraphs
    .replace(/\n\n+/g, '</p><p>')
    // Links: [text](url) — only allow https:// and http:// URLs
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Sanitize any remaining dangerous patterns (belt-and-suspenders)
  for (const pattern of DANGEROUS_PATTERNS) {
    html = html.replace(pattern, '');
  }

  // Wrap in paragraph if not already block-level
  if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<pre') && !html.startsWith('<blockquote')) {
    html = `<p>${html}</p>`;
  }

  return html;
}
