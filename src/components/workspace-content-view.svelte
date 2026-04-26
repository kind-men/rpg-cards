<script>
  import '../styles/documentation.scss';
  import '../styles/prism/gh.css';
</script>

<div class="workspace-content-view">
  <slot />
</div>

<style lang="scss">
  .workspace-content-view :global(.docs-hero) {
    margin-bottom: 1.5rem;
    padding: 2rem 1.75rem;
    position: relative;
    display: grid;
    gap: 1rem;
    justify-items: stretch;
    text-align: left;
    border: 1px solid rgba(18, 38, 63, 0.1);
    border-radius: 1rem;
    background: linear-gradient(180deg, #ffffff 0%, #fbfaf7 100%);
    box-shadow: 0 18px 40px rgba(18, 38, 63, 0.08);
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
    color: #223047;
    font-family: 'Overpass', sans-serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    line-height: 0.95;
    padding-top: 1.5rem;
  }

  .workspace-content-view :global(.docs-hero-copy) {
    max-width: 42rem;
    margin: 0;
    color: #4c5a70;
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
    background: rgba(18, 38, 63, 0.06);
    color: #5e6b81;
    font-size: 1rem;
    line-height: 1;
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease;
  }

  .workspace-content-view :global(.docs-close-button:hover) {
    background: rgba(18, 38, 63, 0.1);
    color: #223047;
  }

  .workspace-content-view :global(.docs-button) {
    padding: 0.7rem 1rem;
    border: 1px solid rgba(18, 38, 63, 0.12);
    border-radius: 0.75rem;
    background: #223047;
    color: #ffffff;
    font-weight: 600;
    text-decoration: none;
    transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
  }

  .workspace-content-view :global(.docs-button:hover) {
    background: #1b2a44;
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(18, 38, 63, 0.14);
  }

  .workspace-content-view :global(.docs-button-secondary) {
    background: #ffffff;
    color: #223047;
  }

  .workspace-content-view :global(.docs-button-secondary:hover) {
    background: #ffffff;
    color: #223047;
  }

  .workspace-content-view :global(.docs-section) {
    margin-bottom: 1rem;
    padding: 1.4rem 1.3rem;
    border: 1px solid rgba(18, 38, 63, 0.08);
    border-radius: 0.9rem;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(18, 38, 63, 0.05);
  }

  .workspace-content-view :global(p),
  .workspace-content-view :global(li) {
    color: #425066;
    line-height: 1.65;
  }

  .workspace-content-view :global(code) {
    padding: 0.1rem 0.35rem;
    border-radius: 0.3rem;
    background: #f6f4ef;
    color: #223047;
  }

  .workspace-content-view :global(pre) {
    padding: 1rem;
    border-radius: 0.75rem;
    background: #f8f6f1;
    border: 1px solid rgba(18, 38, 63, 0.08);
  }

  .workspace-content-view :global(table) {
    width: 100%;
    border-collapse: collapse;
  }

  .workspace-content-view :global(th),
  .workspace-content-view :global(td) {
    padding: 0.65rem 0.75rem;
    border-bottom: 1px solid rgba(18, 38, 63, 0.08);
    text-align: left;
    vertical-align: top;
  }

  .workspace-content-view :global(th) {
    color: #223047;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .workspace-content-view :global(.info-callout) {
    margin-bottom: 1rem;
    padding: 1.4rem 1.3rem;
    border: 1px solid rgba(18, 38, 63, 0.08);
    border-radius: 0.9rem;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(18, 38, 63, 0.05);
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
