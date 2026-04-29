<script lang="ts">
  import type CardContentTypeDescriptor from '$model/card-content-type';
  import { Icon, Input } from '@sveltestrap/sveltestrap';

  export let splitContent: string[] = [];
  export let typeDescriptor: CardContentTypeDescriptor;
</script>

<div class="editor-content-labeled-fields">
  {#each typeDescriptor.params as param, index}
    <div class="editor-content-embedded-input">
      <span class="editor-content-input-icon">
        <Icon
          name={index === 0
            ? splitContent[1]?.trim()
              ? 'justify-left'
              : 'justify'
            : 'justify-right'}
        />
      </span>
      <Input
        class="editor-content-input editor-content-input-with-icon"
        type={param.type ?? 'text'}
        bind:value={splitContent[index]}
        placeholder={param.name}
      />
    </div>
  {/each}
</div>

