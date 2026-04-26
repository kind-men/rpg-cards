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
    position: sticky;
    top: 1.5rem;
  }

  .docs-toc-card {
    padding: 1rem 0.95rem;
    border: 1px solid rgba(18, 38, 63, 0.08);
    border-radius: 0.9rem;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 8px 24px rgba(18, 38, 63, 0.05);
    backdrop-filter: blur(10px);
  }

  .docs-toc-title {
    margin-bottom: 0.65rem;
    color: #223047;
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
    color: #4c5a70;
    font-size: 0.86rem;
    line-height: 1.35;
    text-decoration: none;
    transition: background-color 120ms ease, color 120ms ease;
  }

  .docs-toc-link:hover {
    background: #f6f4ef;
    color: #223047;
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
