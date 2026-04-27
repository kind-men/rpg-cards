<script>
  import '../styles/documentation.scss';
  import '../styles/prism/gh.css';
</script>

<div class="workspace-content-view">
  <slot />
</div>

<style lang="scss">
  .workspace-content-view {
    --workspace-content-view-panel-border: var(--color-border-soft);
    --workspace-content-view-panel-shadow: var(--color-shadow-medium);
    --workspace-content-view-panel-shadow-soft: var(--color-shadow-muted);
    --workspace-content-view-panel-shadow-deep: var(--color-shadow-deep);
    --workspace-content-view-surface: var(--color-surface-base);
    --workspace-content-view-surface-muted: var(--color-surface-muted);
    --workspace-content-view-surface-code: var(--color-surface-panel);
    --workspace-content-view-surface-code-block: var(--color-surface-muted-strong);
    --workspace-content-view-text-primary: var(--color-ink-900);
    --workspace-content-view-text-secondary: var(--color-ink-700);
    --workspace-content-view-text-body: var(--color-ink-650);
    --workspace-content-view-text-muted: var(--color-ink-600);
    --workspace-content-view-overlay: var(--color-overlay-muted);
    --workspace-content-view-overlay-strong: var(--color-overlay-medium);
    --workspace-content-view-button-hover: #1b2a44;
  }

  .workspace-content-view :global(.docs-hero) {
    margin-bottom: 1.5rem;
    padding: 2rem 1.75rem;
    position: relative;
    display: grid;
    gap: 1rem;
    justify-items: stretch;
    text-align: left;
    border: 1px solid var(--workspace-content-view-panel-border);
    border-radius: 1rem;
    background: linear-gradient(180deg, var(--workspace-content-view-surface) 0%, var(--workspace-content-view-surface-muted) 100%);
    box-shadow: 0 18px 40px var(--workspace-content-view-panel-shadow);
  }

  .workspace-content-view :global(.docs-hero-header) {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }

  .workspace-content-view :global(.docs-logo) {
    width: 8rem;
    max-width: 100%;
    height: auto;
    display: block;
  }

  .workspace-content-view :global(.docs-hero-text) {
    min-width: 0;
    display: grid;
    gap: 0.65rem;
  }

  .workspace-content-view :global(.docs-hero-title) {
    margin: 0;
    color: var(--workspace-content-view-text-primary);
    font-family: 'Overpass', sans-serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    line-height: 0.95;
    padding-top: 1.5rem;
  }

  .workspace-content-view :global(.docs-hero-copy) {
    max-width: 42rem;
    margin: 0;
    color: var(--workspace-content-view-text-secondary);
    font-size: 1rem;
    line-height: 1.65;
  }

  .workspace-content-view :global(.docs-hero-actions) {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 0.75rem;
  }

  .workspace-content-view :global(.docs-close-button) {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 999px;
    background: var(--workspace-content-view-overlay);
    color: var(--workspace-content-view-text-muted);
    font-size: 1rem;
    line-height: 1;
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease;
  }

  .workspace-content-view :global(.docs-close-button:hover) {
    background: var(--workspace-content-view-overlay-strong);
    color: var(--workspace-content-view-text-primary);
  }

  .workspace-content-view :global(.docs-button) {
    padding: 0.7rem 1rem;
    border: 1px solid var(--workspace-content-view-panel-border);
    border-radius: 0.75rem;
    background: var(--workspace-content-view-text-primary);
    color: var(--workspace-content-view-surface);
    font-weight: 600;
    text-decoration: none;
    transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
  }

  .workspace-content-view :global(.docs-button:hover) {
    background: var(--workspace-content-view-button-hover);
    color: var(--workspace-content-view-surface);
    transform: translateY(-1px);
    box-shadow: 0 10px 24px var(--workspace-content-view-panel-shadow-deep);
  }

  .workspace-content-view :global(.docs-button-secondary) {
    background: var(--workspace-content-view-surface);
    color: var(--workspace-content-view-text-primary);
  }

  .workspace-content-view :global(.docs-button-secondary:hover) {
    background: var(--workspace-content-view-surface);
    color: var(--workspace-content-view-text-primary);
  }

  .workspace-content-view :global(.docs-section) {
    margin-bottom: 1rem;
    padding: 1.4rem 1.3rem;
    border: 1px solid var(--workspace-content-view-panel-border);
    border-radius: 0.9rem;
    background: var(--workspace-content-view-surface);
    box-shadow: 0 8px 24px var(--workspace-content-view-panel-shadow-soft);
  }

  .workspace-content-view :global(p),
  .workspace-content-view :global(li) {
    color: var(--workspace-content-view-text-body);
    line-height: 1.65;
  }

  .workspace-content-view :global(code) {
    padding: 0.1rem 0.35rem;
    border-radius: 0.3rem;
    background: var(--workspace-content-view-surface-code);
    color: var(--workspace-content-view-text-primary);
  }

  .workspace-content-view :global(pre) {
    padding: 1rem;
    border-radius: 0.75rem;
    background: var(--workspace-content-view-surface-code-block);
    border: 1px solid var(--workspace-content-view-panel-border);
  }

  .workspace-content-view :global(table) {
    width: 100%;
    border-collapse: collapse;
  }

  .workspace-content-view :global(th),
  .workspace-content-view :global(td) {
    padding: 0.65rem 0.75rem;
    border-bottom: 1px solid var(--workspace-content-view-panel-border);
    text-align: left;
    vertical-align: top;
  }

  .workspace-content-view :global(th) {
    color: var(--workspace-content-view-text-primary);
    font-size: 0.85rem;
    font-weight: 700;
  }

  .workspace-content-view :global(.info-callout) {
    margin-bottom: 1rem;
    padding: 1.4rem 1.3rem;
    border: 1px solid var(--workspace-content-view-panel-border);
    border-radius: 0.9rem;
    background: var(--workspace-content-view-surface);
    box-shadow: 0 8px 24px var(--workspace-content-view-panel-shadow-soft);
  }

  @media (max-width: 700px) {
    .workspace-content-view :global(.docs-hero-header) {
      grid-template-columns: 1fr;
    }

    .workspace-content-view :global(.docs-logo) {
      width: 6.5rem;
    }

    .workspace-content-view :global(.docs-hero),
    .workspace-content-view :global(.docs-section),
    .workspace-content-view :global(.info-callout) {
      padding: 1.1rem 1rem;
      border-radius: 0.8rem;
    }
  }
</style>
