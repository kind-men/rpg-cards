<script lang="ts">
  import { assets } from '$app/paths';
  import { Styles } from 'sveltestrap';

  const fontFaceStyle = `<style>
    :root {
      --draconis-font-regular: url('${assets}/fonts/draconis-font/Draconis.ttf') format('truetype');
      --draconis-font-bold: url('${assets}/fonts/draconis-font/DraconisBold.ttf') format('truetype');
      --draconis-font-bold-italic: url('${assets}/fonts/draconis-font/DraconisBoldItalic.ttf') format('truetype');
      --draconis-font-italic: url('${assets}/fonts/draconis-font/DraconisItalic.ttf') format('truetype');
    }
  </style>`;
</script>

<svelte:head>
  <title>RPG Card Generator</title>
  <html lang="en" />
  {@html fontFaceStyle}
</svelte:head>

<Styles />

<slot />

<style lang="scss">
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Overpass:wght@400;500;600;700;800&display=swap');

  @font-face {
    font-family: 'Draconis';
    font-style: normal;
    src: var(--draconis-font-regular);
  }

  @font-face {
    font-family: 'Draconis';
    font-style: normal;
    font-weight: 700;
    src: var(--draconis-font-bold);
  }

  @font-face {
    font-family: 'Draconis';
    font-style: italic;
    font-weight: 700;
    src: var(--draconis-font-bold-italic);
  }

  @font-face {
    font-family: 'Draconis';
    font-style: italic;
    src: var(--draconis-font-italic);
  }

  :global(html),
  :global(body) {
    --color-brand-primary: #51a2ff;

    --color-ink-300: #a3acba;
    --color-ink-450: #8b96a8;
    --color-ink-500: #7c8799;
    --color-ink-550: #6a7688;
    --color-ink-575: #5f6d80;
    --color-ink-600: #5e6b81;
    --color-ink-650: #425066;
    --color-ink-675: #4d5b6f;
    --color-ink-700: #4c5a70;
    --color-ink-900: #223047;
    --color-ink-925: #111c2d;
    --color-ink-950: #111111;

    --color-surface-base: #ffffff;
    --color-surface-panel: #f6f4ef;
    --color-surface-panel-strong: #efebe2;
    --color-surface-panel-active: #e7e1d2;
    --color-surface-muted: #fbfaf7;
    --color-surface-muted-strong: #f8f6f1;
    --color-surface-editor: #f3efe7;
    --color-surface-subtle: #e9ecef;
    --color-surface-selected: #eef2f7;

    --color-white-0: rgba(255, 255, 255, 0);
    --color-white-45: rgba(255, 255, 255, 0.45);
    --color-white-65: rgba(255, 255, 255, 0.65);
    --color-white-90: rgba(255, 255, 255, 0.9);
    --color-white-96: rgba(255, 255, 255, 0.96);
    --color-white-98: rgba(255, 255, 255, 0.98);

    --color-shadow-soft: rgba(18, 38, 63, 0.04);
    --color-shadow-muted: rgba(18, 38, 63, 0.05);
    --color-shadow-light: rgba(18, 38, 63, 0.06);
    --color-shadow-medium: rgba(18, 38, 63, 0.08);
    --color-shadow-strong: rgba(18, 38, 63, 0.12);
    --color-shadow-deep: rgba(18, 38, 63, 0.14);
    --color-shadow-intense: rgba(18, 38, 63, 0.18);
    --color-shadow-intenser: rgba(18, 38, 63, 0.2);
    --color-shadow-heavy: rgba(18, 38, 63, 0.35);

    --color-border-bootstrap: #ced4da;
    --color-border-soft: var(--color-shadow-medium);
    --color-border-medium: var(--color-shadow-strong);
    --color-border-strong: var(--color-shadow-deep);
    --color-border-intense: var(--color-shadow-intense);
    --color-border-active: var(--color-shadow-intenser);
    --color-overlay-faint: var(--color-shadow-soft);
    --color-overlay-soft: var(--color-shadow-muted);
    --color-overlay-muted: var(--color-shadow-light);
    --color-overlay-medium: var(--color-shadow-medium);
    --color-overlay-strong: var(--color-shadow-deep);
    --color-overlay-heavy: var(--color-shadow-heavy);
    --color-danger: #8f3535;
    --color-danger-strong: #9a3c3c;
    --color-danger-border: rgba(154, 60, 60, 0.18);
    --color-danger-surface: rgba(154, 60, 60, 0.06);
    --color-accent-border: rgba(74, 104, 152, 0.45);
    --color-accent-shadow: rgba(74, 104, 152, 0.12);
    --color-warning: #9a6b00;
    --color-warning-surface: rgba(255, 242, 184, 0.96);

    --bs-font-sans-serif: "Inter", sans-serif;
    --bs-border-radius: 0.125rem;
    --section-title-size: 0.9rem;
    --section-title-weight: 550;
    --section-title-spacing: 0.04em;
    --editor-form-font-size: 0.8rem;
    --editor-form-label-line-height: 1.2;
    --editor-form-control-radius: 0.1875rem;
    --editor-form-control-padding-x: 0.375rem;
    --editor-form-control-padding-y: 0.175rem;

    font-family: 'Inter', sans-serif;
  }

  :global(.btn-primary) {
    --layout-btn-primary-bg: var(--color-brand-primary);
    --bs-btn-bg: var(--layout-btn-primary-bg) !important;
  }

  :global(.accordion-item) {
    --layout-accordion-border: var(--color-border-medium);
    --layout-accordion-surface: var(--color-surface-panel);
    --layout-accordion-text: var(--color-ink-900);
    margin-bottom: 0.75rem;
    border: 1px solid var(--layout-accordion-border);
    border-radius: 0.75rem;
    overflow: hidden;
    background: var(--layout-accordion-surface);
    --bs-accordion-btn-bg: var(--layout-accordion-surface);
    --bs-accordion-active-bg: var(--layout-accordion-surface);
    --bs-accordion-btn-color: var(--layout-accordion-text);
    --bs-accordion-active-color: var(--layout-accordion-text);
    --bs-accordion-border-color: var(--layout-accordion-border);
    --bs-accordion-btn-focus-box-shadow: none;
    --bs-accordion-btn-icon: none;
    --bs-accordion-btn-active-icon: none;
  }

  :global(.accordion-item:last-child) {
    margin-bottom: 0;
  }

  :global(.accordion-button) {
    --layout-accordion-button-surface: var(--color-surface-panel);
    --layout-accordion-button-text: var(--color-ink-900);
    padding: 0.55rem 0.875rem;
    background: var(--layout-accordion-button-surface) !important;
    color: var(--layout-accordion-button-text) !important;
    font-size: 0.95rem;
    font-weight: 600;
    box-shadow: none;
  }

  :global(.accordion-button:not(.collapsed)) {
    background: var(--layout-accordion-button-surface) !important;
    color: var(--layout-accordion-button-text) !important;
    box-shadow: none;
  }

  :global(.accordion-button:focus) {
    border-color: transparent;
    box-shadow: none;
  }

  :global(.accordion-button::after) {
    --layout-accordion-icon: var(--color-ink-600);
    width: auto;
    height: auto;
    margin-left: auto;
    background-image: none !important;
    content: '+';
    color: var(--layout-accordion-icon);
    font-size: 1.15rem;
    font-weight: 500;
    line-height: 1;
    transform: none;
  }

  :global(.accordion-button:not(.collapsed)::after) {
    background-image: none !important;
    content: '-';
    transform: none;
  }

  :global(.accordion-body) {
    --layout-accordion-body-surface: var(--color-surface-panel);
    background: var(--layout-accordion-body-surface);
  }

  :global(hr) {
    margin: 0.5rem 0 !important;
  }
</style>
