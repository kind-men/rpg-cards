<script lang="ts">
  export let items: Array<{ href: string; label: string; level?: number }> = [];
</script>

<aside class="docs-toc" aria-label="Documentation table of contents">
  <div class="docs-toc-card">
    <div class="docs-toc-title">On this page</div>
    <nav class="docs-toc-nav">
      {#each items as item}
        <a
          class="docs-toc-link"
          class:docs-toc-link-level-2={(item.level ?? 1) === 2}
          class:docs-toc-link-level-3={(item.level ?? 1) === 3}
          href={item.href}
        >
          {item.label}
        </a>
      {/each}
    </nav>
  </div>
</aside>

<style lang="scss">
  .docs-toc {
    --docs-toc-border: var(--color-border-soft);
    --docs-toc-surface: var(--color-white-90);
    --docs-toc-shadow: var(--color-shadow-100);
    --docs-toc-title: var(--color-ink-900);
    --docs-toc-link: var(--color-ink-700);
    --docs-toc-link-hover-surface: var(--color-surface-panel);
    --docs-toc-link-hover-text: var(--color-ink-900);
    position: sticky;
    top: 1.5rem;
  }

  .docs-toc-card {
    padding: 1rem 0.95rem;
    border: 1px solid var(--docs-toc-border);
    border-radius: 0.9rem;
    background: var(--docs-toc-surface);
    box-shadow: 0 8px 24px var(--docs-toc-shadow);
    backdrop-filter: blur(10px);
  }

  .docs-toc-title {
    margin-bottom: 0.65rem;
    color: var(--docs-toc-title);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .docs-toc-nav {
    display: grid;
    gap: 0.2rem;
  }

  .docs-toc-link {
    padding: 0.35rem 0.45rem;
    border-radius: 0.55rem;
    color: var(--docs-toc-link);
    font-size: 0.86rem;
    line-height: 1.35;
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease;
  }

  .docs-toc-link:hover {
    background: var(--docs-toc-link-hover-surface);
    color: var(--docs-toc-link-hover-text);
  }

  .docs-toc-link-level-2 {
    padding-left: 1rem;
    font-size: 0.82rem;
  }

  .docs-toc-link-level-3 {
    padding-left: 1.5rem;
    font-size: 0.8rem;
  }
</style>
