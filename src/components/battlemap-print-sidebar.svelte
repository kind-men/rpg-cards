<script lang="ts">
  import { Icon, Input, InputGroup, InputGroupText, Label } from '@sveltestrap/sveltestrap';
  import type { BattlemapGridOverlay } from '$model/battlemap';
  import { battlemapProject } from '../stores/battlemap';

  const gridOverlayOptions: { value: BattlemapGridOverlay; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
  ];

  const setMargin = (
    side: 'top' | 'right' | 'bottom' | 'left',
    event: Event
  ) => {
    const value = Number((event.currentTarget as HTMLInputElement).value);

    battlemapProject.update((project) => ({
      ...project,
      print: {
        ...project.print,
        margins: {
          ...project.print.margins,
          [side]: Math.max(0, value || 0)
        }
      }
    }));
  };

  const setGridOverlay = (event: Event) => {
    const gridOverlay = (event.currentTarget as HTMLSelectElement).value as BattlemapGridOverlay;

    battlemapProject.update((project) => ({
      ...project,
      print: {
        ...project.print,
        gridOverlay
      }
    }));
  };

  const setGridOffset = (axis: 'x' | 'y', event: Event) => {
    const value = Number((event.currentTarget as HTMLInputElement).value);

    battlemapProject.update((project) => ({
      ...project,
      print: {
        ...project.print,
        gridOffset: {
          ...project.print.gridOffset,
          [axis]: value || 0
        }
      }
    }));
  };
</script>

<section class="sidebar-section">
  <div class="sidebar-section-header">
    <h1 class="sidebar-section-title">Battlemaps</h1>
  </div>
  <div class="sidebar-section-body">
    <div class="battlemap-sidebar-summary">
      <Icon name="map" />
      <span>{$battlemapProject.name || 'Untitled battlemap'}</span>
    </div>
  </div>
</section>

<section class="sidebar-section">
  <div class="sidebar-section-header">
    <h2 class="sidebar-section-title">Page Layout</h2>
  </div>
  <div class="sidebar-form">
    <div class="sidebar-field">
      <Label for="battlemap-sidebar-margins">Margins</Label>
      <div id="battlemap-sidebar-margins" class="battlemap-sidebar-quad">
        <InputGroup>
          <InputGroupText>T</InputGroupText>
          <Input type="number" value={$battlemapProject.print.margins.top} on:input={(event) => setMargin('top', event)} />
        </InputGroup>
        <InputGroup>
          <InputGroupText>R</InputGroupText>
          <Input type="number" value={$battlemapProject.print.margins.right} on:input={(event) => setMargin('right', event)} />
        </InputGroup>
        <InputGroup>
          <InputGroupText>B</InputGroupText>
          <Input type="number" value={$battlemapProject.print.margins.bottom} on:input={(event) => setMargin('bottom', event)} />
        </InputGroup>
        <InputGroup>
          <InputGroupText>L</InputGroupText>
          <Input type="number" value={$battlemapProject.print.margins.left} on:input={(event) => setMargin('left', event)} />
        </InputGroup>
      </div>
    </div>
  </div>
</section>

<section class="sidebar-section">
  <div class="sidebar-section-header">
    <h2 class="sidebar-section-title">Grid Overlay</h2>
  </div>
  <div class="sidebar-form">
    <div class="sidebar-field">
      <Label for="battlemap-sidebar-grid-overlay">Overlay</Label>
      <Input id="battlemap-sidebar-grid-overlay" type="select" value={$battlemapProject.print.gridOverlay} on:change={setGridOverlay}>
        {#each gridOverlayOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </Input>
    </div>
    {#if $battlemapProject.print.gridOverlay !== 'none'}
      <div class="sidebar-field">
        <Label for="battlemap-sidebar-grid-offset">Offset</Label>
        <div id="battlemap-sidebar-grid-offset" class="battlemap-sidebar-pair">
          <InputGroup>
            <InputGroupText>X</InputGroupText>
            <Input type="number" value={$battlemapProject.print.gridOffset.x} on:input={(event) => setGridOffset('x', event)} />
            <InputGroupText>px</InputGroupText>
          </InputGroup>
          <InputGroup>
            <InputGroupText>Y</InputGroupText>
            <Input type="number" value={$battlemapProject.print.gridOffset.y} on:input={(event) => setGridOffset('y', event)} />
            <InputGroupText>px</InputGroupText>
          </InputGroup>
        </div>
      </div>
    {/if}
  </div>
</section>

<style lang="scss">
  .battlemap-sidebar-summary {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--color-ink-700);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .battlemap-sidebar-summary span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .battlemap-sidebar-pair,
  .battlemap-sidebar-quad {
    display: grid;
    gap: 0.35rem;
  }

  .battlemap-sidebar-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .battlemap-sidebar-quad {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
</style>
