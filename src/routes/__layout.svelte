<script lang="ts">
  import { assets } from '$app/paths';
  import { Styles } from 'sveltestrap';
</script>

<svelte:head>
  <title>RPG Card Generator</title>
  <html lang="en" />
</svelte:head>

<Styles />

<slot />

<style lang="scss">
  @import '../styles/global.scss';
</style>
