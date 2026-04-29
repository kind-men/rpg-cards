import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: false });

type RenderTextMarkdownOptions = {
  disabled?: boolean;
  inline?: boolean;
};

export type RenderTextOptions = {
  markdown?: RenderTextMarkdownOptions;
};

export function renderText(input?: string, options?: RenderTextOptions): string {
  if (!input) {
    return '';
  }

  let html: string;

  if (!options?.markdown?.disabled) {
    if (options?.markdown?.inline ?? true) {
      html = md.renderInline(input);
    } else {
      html = md.render(input);
    }
  } else {
    html = escapeHtml(input);
  }

  return html?.replace('\\|', '|') ?? '';
}

const escapeHtml = (input: string): string =>
  input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
