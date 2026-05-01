<script lang="ts">
  import JsonEditor from '$components/form/code-editor/json.svelte';
  import { shortcut } from '$lib/shortcut';
  import debounce from 'just-debounce-it';
  import { Icon, Toast, ToastHeader } from '@sveltestrap/sveltestrap';

  type T = $$Generic;

  export let deckData: T;
  export let error: string = undefined;
  export let changed = false;
  export let serialize = (value: T) => JSON.stringify(value, undefined, 2);
  export let deserialize = (json: string) => JSON.parse(json) as T;

  let jsonText = serialize(deckData);
  let isSavedToastOpen = false;
  let jsonEditor: JsonEditor;

  const clearIsSavedToast = debounce(() => {
    isSavedToastOpen = false;
  }, 1000);

  export const save = (onSuccess?: () => void) => {
    jsonEditor?.clearErrors();
    error = undefined;

    try {
      const nextJson = jsonEditor?.getValue() ?? jsonText;
      deckData = deserialize(nextJson);
      jsonText = serialize(deckData);
      changed = false;

      isSavedToastOpen = true;
      clearIsSavedToast();

      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      if (e instanceof Error) {
        error = e.message;
        jsonEditor?.openErrors();
      }
    }
  };

  $: if (!changed) {
    jsonText = serialize(deckData);
  }
</script>

<div>
  <div class="toast-wrapper">
    <Toast isOpen={isSavedToastOpen}>
      <ToastHeader>
        <Icon slot="icon" name="check-circle-fill" class="me-2" />
        Saved!
      </ToastHeader>
    </Toast>
  </div>
  <div
    class="wrapper"
    use:shortcut={{
      control: true,
      code: 'KeyS',
      callback: () => {
        save();
      }
    }}
  >
    <JsonEditor bind:this={jsonEditor} bind:value={jsonText} bind:changed />
  </div>
</div>

<style lang="scss">
  .wrapper {
    display: flex;
    flex-direction: column;
  }

  .toast-wrapper {
    position: fixed;
    top: 1em;
    z-index: 15;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
</style>

