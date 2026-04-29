<script lang="ts">
  import CodeEditor from '../code-editor.svelte';
  import { css as cssLanguageSupport, cssCompletion } from '@codemirror/lang-css';
  import { lintGutter } from '@codemirror/lint';

  export let value = '';
  export let changed = false;
  export let id = '';
  let className = '';
  export { className as class };

  const ensureMultilineValue = (value: string) => {
    let nextValue = value ?? '';

    if (nextValue.split('\n').length < 2) {
      nextValue = nextValue + '\n';
    }

    return nextValue;
  };

  const trimTrailingWhitespace = (value: string) => value.trimEnd();
  const extensions = [lintGutter(), cssLanguageSupport(), cssCompletion];
</script>

<CodeEditor
  bind:value
  bind:changed
  {id}
  {extensions}
  class={className}
  transformExternalValue={ensureMultilineValue}
  transformInternalValue={trimTrailingWhitespace}
/>
