<script lang="ts">
  import WorkspaceContentView from '$components/workspace-content-view.svelte';
  import WorkspaceShell from '$components/workspace-shell.svelte';
  import DocsContent from '../../content/docs.svx';
</script>

<WorkspaceShell view="docs">
  <WorkspaceContentView>
    <DocsContent />
  </WorkspaceContentView>
</WorkspaceShell>
