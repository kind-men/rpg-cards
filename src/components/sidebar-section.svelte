<script lang="ts">
  export let title: string | undefined = undefined;
  export let grow = false;
</script>

<section class:sidebar-section-grow={grow} class="sidebar-section">
  {#if $$slots.header}
    <div class="sidebar-section-header">
      <slot name="header" />
    </div>
  {:else if title}
    <div class="sidebar-section-header">
      <h2 class="sidebar-section-title">{title}</h2>
    </div>
  {/if}

  <div class="sidebar-section-body">
    <slot />
  </div>
</section>
