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

  :global(.accordion-item) {
    margin-bottom: 0.75rem;
    border: 1px solid rgba(18, 38, 63, 0.12);
    border-radius: 0.75rem;
    overflow: hidden;
    background: #f6f4ef;
    --bs-accordion-btn-bg: #f6f4ef;
    --bs-accordion-active-bg: #f6f4ef;
    --bs-accordion-btn-color: #223047;
    --bs-accordion-active-color: #223047;
    --bs-accordion-border-color: rgba(18, 38, 63, 0.12);
    --bs-accordion-btn-focus-box-shadow: none;
    --bs-accordion-btn-icon: none;
    --bs-accordion-btn-active-icon: none;
  }

  :global(.accordion-item:last-child) {
    margin-bottom: 0;
  }

  :global(.accordion-button) {
    padding: 0.55rem 0.875rem;
    background: #f6f4ef !important;
    color: #223047 !important;
    font-size: 0.95rem;
    font-weight: 600;
    box-shadow: none;
  }

  :global(.accordion-button:not(.collapsed)) {
    background: #f6f4ef !important;
    color: #223047 !important;
    box-shadow: none;
  }

  :global(.accordion-button:focus) {
    border-color: transparent;
    box-shadow: none;
  }

  :global(.accordion-button::after) {
    width: auto;
    height: auto;
    margin-left: auto;
    background-image: none !important;
    content: '+';
    color: #5e6b81;
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
    background: #f6f4ef;
  }

  :global(hr) {
    margin: 0.5rem 0 !important;
  }
</style>
