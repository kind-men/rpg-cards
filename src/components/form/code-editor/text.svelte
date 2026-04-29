<script lang="ts">
  import CodeEditor from '../code-editor.svelte';

  export let value = '';
  export let changed = false;
  export let id = '';
  let className = '';
  export { className as class };
</script>

<CodeEditor bind:value bind:changed {id} class={className} />
