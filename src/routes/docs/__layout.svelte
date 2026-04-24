<script>
  import '../../styles/documentation.scss';
  import '../../styles/prism/gh.css';
</script>

<div class="docs-shell">
  <div class="content">
    <slot />
  </div>
</div>

<style lang="scss">
  :global(html),
  :global(body) {
    overflow: auto;
    min-height: 100%;
    background: #f6f4ef;
  }

  .docs-shell {
    min-height: 100vh;
    padding: 2.5rem 1rem 4rem;
    background:
      radial-gradient(circle at top, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0) 35%),
      #f6f4ef;
  }

  .content {
    $width: 800px;

    margin: 0 auto;
    width: $width;
    max-width: 100%;
  }

  .content :global(.docs-hero) {
    margin-bottom: 1.5rem;
    padding: 2rem 1.75rem;
    display: grid;
    gap: 1rem;
    justify-items: center;
    text-align: center;
    border: 1px solid rgba(18, 38, 63, 0.1);
    border-radius: 1rem;
    background: linear-gradient(180deg, #ffffff 0%, #fbfaf7 100%);
    box-shadow: 0 18px 40px rgba(18, 38, 63, 0.08);
  }

  .content :global(.docs-logo) {
    width: 8rem;
    max-width: 100%;
    height: auto;
    display: block;
  }

  .content :global(.docs-hero-title) {
    margin: 0;
    color: #223047;
    font-family: 'Overpass', sans-serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    line-height: 0.95;
  }

  .content :global(.docs-hero-copy) {
    max-width: 40rem;
    margin: 0;
    color: #4c5a70;
    font-size: 1rem;
    line-height: 1.65;
  }

  .content :global(.docs-hero-actions) {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }

  .content :global(.docs-button) {
    padding: 0.7rem 1rem;
    border: 1px solid rgba(18, 38, 63, 0.12);
    border-radius: 0.75rem;
    background: #223047;
    color: #ffffff;
    font-weight: 600;
    text-decoration: none;
    transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
  }

  .content :global(.docs-button:hover) {
    background: #1b2a44;
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(18, 38, 63, 0.14);
  }

  .content :global(.docs-button-secondary) {
    background: #ffffff;
    color: #223047;
  }

  .content :global(.docs-button-secondary:hover) {
    background: #ffffff;
    color: #223047;
  }

  .content :global(.docs-section) {
    margin-bottom: 1rem;
    padding: 1.4rem 1.3rem;
    border: 1px solid rgba(18, 38, 63, 0.08);
    border-radius: 0.9rem;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(18, 38, 63, 0.05);
  }

  .content :global(.docs-section h2:first-child),
  .content :global(.docs-section h3:first-child) {
    margin-top: 0;
  }

  .content :global(h2) {
    color: #223047;
    font-family: 'Overpass', sans-serif;
    font-size: 1.45rem;
    font-weight: 700;
  }

  .content :global(h3) {
    color: #223047;
    font-size: 1.05rem;
    font-weight: 700;
  }

  .content :global(p),
  .content :global(li) {
    color: #425066;
    line-height: 1.65;
  }

  .content :global(code) {
    padding: 0.1rem 0.35rem;
    border-radius: 0.3rem;
    background: #f6f4ef;
    color: #223047;
  }

  .content :global(pre) {
    padding: 1rem;
    border-radius: 0.75rem;
    background: #f8f6f1;
    border: 1px solid rgba(18, 38, 63, 0.08);
  }

  .content :global(table) {
    width: 100%;
    border-collapse: collapse;
  }

  .content :global(th),
  .content :global(td) {
    padding: 0.65rem 0.75rem;
    border-bottom: 1px solid rgba(18, 38, 63, 0.08);
    text-align: left;
    vertical-align: top;
  }

  .content :global(th) {
    color: #223047;
    font-size: 0.85rem;
    font-weight: 700;
  }

  @media (max-width: 700px) {
    .docs-shell {
      padding: 1rem 0.75rem 2rem;
    }

    .content :global(.docs-hero),
    .content :global(.docs-section) {
      padding: 1.1rem 1rem;
      border-radius: 0.8rem;
    }
  }
</style>
