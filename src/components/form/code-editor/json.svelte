<script lang="ts">
  import CodeEditor from '../code-editor.svelte';
  import { json as jsonLanguageSupport, jsonParseLinter } from '@codemirror/lang-json';
  import { closeLintPanel, lintGutter, linter, openLintPanel } from '@codemirror/lint';

  export let value = '';
  export let changed = false;
  export let id = '';
  let className = '';
  export { className as class };

  let codeEditor: CodeEditor;
  const extensions = Object.freeze([
    jsonLanguageSupport(),
    linter(jsonParseLinter()),
    lintGutter()
  ]);

  export const getValue = () => codeEditor?.getValue() ?? value;
  export const focus = () => codeEditor?.focus();
  export const openErrors = () => {
    const editor = codeEditor?.getEditor();
    if (editor) {
      openLintPanel(editor);
    }
  };
  export const clearErrors = () => {
    const editor = codeEditor?.getEditor();
    if (editor) {
      closeLintPanel(editor);
    }
  };
</script>

<CodeEditor bind:this={codeEditor} bind:value bind:changed {id} {extensions} class={className} />
