<script lang="ts">
  import { basicSetup, EditorState, EditorView } from '@codemirror/basic-setup';
  import type { ViewUpdate } from '@codemirror/view';
  import { onMount } from 'svelte';

  export let value = '';
  export let id = '';
  let clazz = '';
  export { clazz as class };

  let parent: HTMLDivElement;
  let editor: EditorView;
  let isApplyingExternalValue = false;

  const getDocValue = () => editor?.state.doc.toString() ?? '';

  const onEditorUpdate = (update: ViewUpdate) => {
    if (!update.docChanged || isApplyingExternalValue) {
      return;
    }

    value = update.state.doc.toString();
  };

  onMount(() => {
    editor = new EditorView({
      state: EditorState.create({
        extensions: [basicSetup, EditorView.lineWrapping, EditorView.updateListener.of(onEditorUpdate)],
        doc: value ?? ''
      }),
      parent
    });

    return () => {
      editor?.destroy();
    };
  });

  $: if (editor) {
    const nextValue = value ?? '';
    const currentValue = getDocValue();

    if (nextValue !== currentValue) {
      isApplyingExternalValue = true;
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: nextValue
        }
      });
      isApplyingExternalValue = false;
    }
  }
</script>

<div {id} class={`wrapper form-control input ${clazz}`.trim()} bind:this={parent} />

<style lang="scss">
  .wrapper {
    min-height: 0;
    display: flex;
    flex: 1 1 auto;
    padding: 0;
    overflow: hidden;

    :global(.cm-editor) {
      --text-editor-surface: var(--color-surface-muted);
      min-height: 0;
      height: 100%;
      flex: 1 1 auto;
      background: var(--text-editor-surface);
    }

    :global(.cm-scroller) {
      overflow: auto;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      line-height: 1.55;
    }

    :global(.cm-content),
    :global(.cm-gutterElement) {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.82rem;
    }

    :global(.cm-content) {
      padding: 0.8rem 0.9rem;
      white-space: pre-wrap;
      tab-size: 2;
    }

    :global(.cm-focused) {
      outline: none;
    }

    :global(.cm-gutters) {
      border-right: 1px solid var(--color-border-soft);
      background: var(--color-surface-editor);
    }
  }
</style>
