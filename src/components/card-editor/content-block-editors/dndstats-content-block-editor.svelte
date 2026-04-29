<script lang="ts">
  import { Input } from '@sveltestrap/sveltestrap';

  export let splitContent: string[] = [];

  const statFields = [
    { key: 'str', label: 'Str' },
    { key: 'dex', label: 'Dex' },
    { key: 'con', label: 'Con' },
    { key: 'int', label: 'Int' },
    { key: 'wis', label: 'Wis' },
    { key: 'cha', label: 'Cha' }
  ];
</script>

<div class="editor-content-grid-fields">
  {#each statFields as stat, index}
    <div class="editor-content-field-row">
      <span class="editor-content-field-label">{stat.label}</span>
      <Input
        class="editor-content-input"
        type="number"
        bind:value={splitContent[index]}
        placeholder={stat.label}
      />
    </div>
  {/each}
</div>

