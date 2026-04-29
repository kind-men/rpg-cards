<script lang="ts">
  import DocsToc from '$components/docs-toc.svelte';
  import WorkspaceContentView from '$components/workspace-content-view.svelte';
  import WorkspaceShell from '$components/workspace-shell.svelte';
  import DocsContent from '../../content/docs.svx';

  const tocItems = [
    { href: '#overview', label: 'Overview', level: 1 },
    { href: '#working-with-cards', label: 'Working with cards', level: 1 },
    { href: '#import-export', label: 'Import and export', level: 1 },
    { href: '#print-view', label: 'Print view', level: 1 },
    { href: '#export-data', label: 'JSON Format', level: 1 },
    { href: '#card-data', label: 'Card', level: 2 },
    { href: '#layout-data', label: 'Layout', level: 2 },
    { href: '#contents', label: 'Contents', level: 2 },
    { href: '#content-types', label: 'Content types', level: 3 },
    { href: '#icons', label: 'Icons', level: 1 }
  ];
</script>

<WorkspaceShell view="docs" contentMaxWidth="1120px">
  <WorkspaceContentView>
    <div class="docs-page-layout">
      <div class="docs-page-main">
        <DocsContent />
      </div>
      <DocsToc items={tocItems} />
    </div>
  </WorkspaceContentView>
</WorkspaceShell>

<style lang="scss">
  .docs-page-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 240px;
    gap: 1.25rem;
    align-items: start;
  }

  .docs-page-main {
    min-width: 0;
  }

  @media (max-width: 980px) {
    .docs-page-layout {
      grid-template-columns: 1fr;
    }

    :global(.docs-toc) {
      display: none;
    }
  }
</style>
