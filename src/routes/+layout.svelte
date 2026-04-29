<script lang="ts">
  import { assets } from '$app/paths';
  import { Styles } from '@sveltestrap/sveltestrap';
</script>

<svelte:head>
  <title>RPG Card Generator</title>
</svelte:head>

<Styles />

<slot />

<style lang="scss">
  @use '../styles/global.scss';
</style>

