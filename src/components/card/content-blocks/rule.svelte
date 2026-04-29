<script lang="ts">
  import type { CardContent } from '$model/card';

  export let content: CardContent;
  $: void content;
</script>

<div class="rule" />

<style>
  .rule {
    border-bottom: 2px solid var(--card-color);
    margin-bottom: 0.2em;
    margin-left: -2px;
    margin-right: -2px;
  }
</style>
