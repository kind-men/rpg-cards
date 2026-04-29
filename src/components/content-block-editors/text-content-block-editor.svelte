<script lang="ts">
  import type CardContentTypeDescriptor from '$model/card-content-type';
  import MarkdownEditor from '../markdown-editor.svelte';

  export let splitContent: string[] = [];
  export let typeDescriptor: CardContentTypeDescriptor;
</script>

<MarkdownEditor bind:value={splitContent[0]} height="280px" />
