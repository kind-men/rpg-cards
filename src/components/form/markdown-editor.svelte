<script lang="ts">
  import '@toast-ui/editor/dist/toastui-editor.css';
  import { onMount } from 'svelte';

  export let value = '';
  export let height = '320px';

  let host: HTMLDivElement;
  let editor: any;
  let isApplyingExternalValue = false;

  const syncFromEditor = () => {
    if (!editor || isApplyingExternalValue) {
      return;
    }

    value = editor.getMarkdown();
  };

  onMount(() => {
    let disposed = false;

    void (async () => {
      const { Editor } = await import('@toast-ui/editor');
      if (disposed) {
        return;
      }

      editor = new Editor({
        el: host,
        height,
        initialValue: value ?? '',
        initialEditType: 'wysiwyg',
        autofocus: false,
        previewStyle: 'vertical',
        toolbarItems: [['bold', 'italic', 'hr', 'ul']],
        usageStatistics: false,
        hideModeSwitch: false
      });

      editor.on('change', syncFromEditor);
    })();

    return () => {
      disposed = true;
      if (editor) {
        editor.off?.('change', syncFromEditor);
        editor.destroy?.();
      }
    };
  });

  $: if (editor) {
    const nextValue = value ?? '';
    const currentValue = editor.getMarkdown();

    if (nextValue !== currentValue) {
      isApplyingExternalValue = true;
      editor.setMarkdown(nextValue, false);
      isApplyingExternalValue = false;
    }
  }
</script>

<div class="markdown-editor" bind:this={host}></div>

<style lang="scss">
  .markdown-editor {
    min-height: 0;

    :global(.toastui-editor-defaultUI) {
      border: 0;
      border-radius: 0;
      overflow: visible;
      box-shadow: none;
    }

    :global(.toastui-editor-defaultUI .ProseMirror) {
      padding: .5rem;
    }

    :global(.toastui-editor-toolbar) {
      height: 32px !important;
    }

    :global(.toastui-editor-defaultUI-toolbar) {
      padding: 0;
      height: 32px !important;
    }

    :global(.toastui-editor-toolbar-group) {
      margin-right: 0.3rem;
    }

    :global(.toastui-editor-defaultUI-toolbar button) {
      transform: scale(0.8);
      transform-origin: center;
      margin:0;
    }

    :global(.toastui-editor-main) {
      border-radius: 0;
    }

    :global(.toastui-editor-md-container),
    :global(.toastui-editor-ww-container) {
      border-radius: 0;
    }

    :global(.toastui-editor-contents) {
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
    }
  }
</style>
