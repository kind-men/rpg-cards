<script lang="ts">
  import MarkdownEditor from '../../form/markdown-editor.svelte';

  export let splitContent: string[] = [];
</script>

<MarkdownEditor bind:value={splitContent[0]} height="280px" />
