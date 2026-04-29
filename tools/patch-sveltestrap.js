import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sveltestrapSrc = path.join(root, 'node_modules', 'sveltestrap', 'src');

const fileContents = {
  'Alert.svelte': `<script>
  import { fade as fadeTransition } from 'svelte/transition';
  import classnames from './utils';

  let className = '';
  export { className as class };
  export let children = undefined;
  export let color = 'success';
  export let closeClassName = '';
  export let closeAriaLabel = 'Close';
  export let dismissible = false;
  export let heading = undefined;
  export let isOpen = true;
  export let toggle = undefined;
  export let fade = true;
  export let transition = { duration: fade ? 400 : 0 };

  $: showClose = dismissible || toggle;
  $: handleToggle = toggle || (() => (isOpen = false));
  $: classes = classnames(className, 'alert', \`alert-\${color}\`, {
    'alert-dismissible': showClose
  });
  $: closeClassNames = classnames('btn-close', closeClassName);
</script>

{#if isOpen}
  <div
    {...$$restProps}
    transition:fadeTransition={transition}
    class={classes}
    role="alert"
  >
    {#if heading}
      <h4 class="alert-heading">{heading}</h4>
    {/if}
    {#if showClose}
      <button
        type="button"
        class={closeClassNames}
        aria-label={closeAriaLabel}
        on:click={handleToggle}
      ></button>
    {/if}
    {#if typeof children === 'function'}
      {@render children()}
    {:else if children != null}
      {children}
    {/if}
  </div>
{/if}
`,
  'Badge.svelte': `<script>
  import classnames from './utils';

  let className = '';
  export { className as class };
  export let children = undefined;
  export let color = 'secondary';
  export let href = undefined;
  export let pill = false;

  $: classes = classnames(
    className,
    'badge',
    \`text-bg-\${color}\`,
    pill ? 'rounded-pill' : false
  );
</script>

{#if href}
  <a {...$$restProps} {href} class={classes}>
    {#if typeof children === 'function'}
      {@render children()}
    {:else if children != null}
      {children}
    {/if}
  </a>
{:else}
  <span {...$$restProps} class={classes}>
    {#if typeof children === 'function'}
      {@render children()}
    {:else if children != null}
      {children}
    {/if}
  </span>
{/if}
`,
  'Breadcrumb.svelte': `<script>
  import classnames from './utils';

  let className = '';
  export { className as class };
  export let children = undefined;
  export let divider = undefined;
  export let listClassName = '';
  export let style = undefined;

  $: listClasses = classnames('breadcrumb', listClassName);
  $: styles = divider
    ? \`--bs-breadcrumb-divider: '\${divider}'; \${style || ''}\`
    : style;
</script>

<nav style={styles} {...$$restProps} class={className}>
  <ol class={listClasses}>
    {#if typeof children === 'function'}
      {@render children()}
    {:else if children != null}
      {children}
    {/if}
  </ol>
</nav>
`,
  'BreadcrumbItem.svelte': `<script>
  import classnames from './utils';

  let className = '';
  export { className as class };
  export let active = false;
  export let children = undefined;

  $: classes = classnames(
    className,
    active ? 'active' : false,
    'breadcrumb-item'
  );
</script>

<li {...$$restProps} class={classes} aria-current={active ? 'page' : undefined}>
  {#if typeof children === 'function'}
    {@render children()}
  {:else if children != null}
    {children}
  {/if}
</li>
`,
  'Button.svelte': `<script>
  import classnames from './utils';

  let className = '';
  export { className as class };
  export let active = false;
  export let block = false;
  export let children = undefined;
  export let close = false;
  export let color = 'secondary';
  export let disabled = false;
  export let href = '';
  export let inner = undefined;
  export let outline = false;
  export let size = null;
  export let value = '';

  $: ariaLabel = $$props['aria-label'];

  $: classes = classnames(
    className,
    close ? 'btn-close' : 'btn',
    close || \`btn\${outline ? '-outline' : ''}-\${color}\`,
    size ? \`btn-\${size}\` : false,
    block ? 'd-block w-100' : false,
    {
      active
    }
  );

  $: defaultAriaLabel = close ? 'Close' : null;
</script>

{#if href}
  <a
    {...$$restProps}
    class={classes}
    {disabled}
    bind:this={inner}
    on:click
    {href}
    aria-label={ariaLabel || defaultAriaLabel}
  >
    {#if typeof children === 'function'}
      {@render children()}
    {:else if children != null}
      {children}
    {/if}
  </a>
{:else}
  <button
    {...$$restProps}
    class={classes}
    {disabled}
    bind:this={inner}
    on:click
    {value}
    aria-label={ariaLabel || defaultAriaLabel}
  >
    {#if typeof children === 'function'}
      {@render children()}
    {:else if children != null}
      {children}
    {/if}
  </button>
{/if}
`,
  'ModalHeader.svelte': `<script>
  import classnames from './utils';

  let className = '';
  export { className as class };
  export let toggle = undefined;
  export let closeAriaLabel = 'Close';
  export let children = undefined;
  export let id = undefined;

  $: classes = classnames(className, 'modal-header');
</script>

<div {...$$restProps} class={classes}>
  <h5 class="modal-title" {id}>
    {#if typeof children === 'function'}
      {@render children()}
    {:else if children != null}
      {children}
    {/if}
  </h5>
  {#if typeof toggle === 'function'}
    <button
      type="button"
      on:click={toggle}
      class="btn-close"
      aria-label={closeAriaLabel}
    ></button>
  {/if}
</div>
`,
  'OffcanvasHeader.svelte': `<script>
  import classnames from './utils';

  let className = '';
  export { className as class };
  export let children = undefined;
  export let closeAriaLabel = 'Close';
  export let toggle = undefined;

  $: classes = classnames(className, 'offcanvas-header');
</script>

<div {...$$restProps} class={classes}>
  <h5 class="offcanvas-title">
    {#if typeof children === 'function'}
      {@render children()}
    {:else if children != null}
      {children}
    {/if}
  </h5>
  {#if typeof toggle === 'function'}
    <button
      aria-label={closeAriaLabel}
      class="btn-close"
      on:click={toggle}
      type="button"
    ></button>
  {/if}
</div>
`,
  'Popover.svelte': `<script>
  import { onMount } from 'svelte';
  import { createPopper } from '@popperjs/core';
  import classnames from './utils';
  import InlineContainer from './InlineContainer.svelte';
  import Portal from './Portal.svelte';

  let className = '';
  export { className as class };
  export let animation = true;
  export let children = undefined;
  export let container = undefined;
  export let dismissible = false;
  export let isOpen = false;
  export let placement = 'top';
  export let target = '';
  export let title = '';
  export let trigger = 'click';
  let targetEl;
  let popoverEl;
  let popperInstance;
  let bsPlacement;
  let popperPlacement = placement;

  const checkPopperPlacement = {
    name: 'checkPopperPlacement',
    enabled: true,
    phase: 'main',
    fn({ state }) {
      popperPlacement = state.placement;
    }
  };

  $: {
    if (isOpen && popoverEl) {
      popperInstance = createPopper(targetEl, popoverEl, {
        placement,
        modifiers: [
          checkPopperPlacement,
          {
            name: 'offset',
            options: {
              offset: () => {
                return [0, 8];
              }
            }
          }
        ]
      });
    } else if (popperInstance) {
      popperInstance.destroy();
      popperInstance = undefined;
    }
  }

  const open = () => (isOpen = true);
  const close = () => (isOpen = false);
  const toggle = () => (isOpen = !isOpen);

  onMount(() => {
    targetEl = document.querySelector(\`#\${target}\`);
    switch (trigger) {
      case 'hover':
        targetEl.addEventListener('mouseover', open);
        targetEl.addEventListener('mouseleave', close);
        break;
      case 'focus':
        targetEl.addEventListener('focus', open);
        targetEl.addEventListener('blur', close);
        break;
      default:
        targetEl.addEventListener('click', toggle);
        if (dismissible) targetEl.addEventListener('blur', close);
        break;
    }
    return () => {
      switch (trigger) {
        case 'hover':
          targetEl.removeEventListener('mouseover', open);
          targetEl.removeEventListener('mouseleave', close);
          break;
        case 'focus':
          targetEl.removeEventListener('focus', open);
          targetEl.removeEventListener('blur', close);
          break;
        default:
          targetEl.removeEventListener('click', toggle);
          if (dismissible) targetEl.removeEventListener('blur', close);
          break;
      }
    };
  });

  $: if (!target) {
    throw new Error('Need target!');
  }

  $: {
    if (popperPlacement === 'left') bsPlacement = 'start';
    else if (popperPlacement === 'right') bsPlacement = 'end';
    else bsPlacement = popperPlacement;
  }

  $: classes = classnames(
    className,
    'popover',
    animation ? 'fade' : false,
    \`bs-popover-\${bsPlacement}\`,
    isOpen ? 'show' : false
  );

  $: outer = container === 'inline' ? InlineContainer : Portal;
</script>

{#if isOpen}
  <svelte:component this={outer}>
    <div
      bind:this={popoverEl}
      {...$$restProps}
      class={classes}
      role="tooltip"
      x-placement={popperPlacement}
    >
      <div class="popover-arrow" data-popper-arrow></div>
      <h3 class="popover-header">{title}</h3>
      <div class="popover-body">
        {#if typeof children === 'function'}
          {@render children()}
        {:else if children != null}
          {children}
        {/if}
      </div>
    </div>
  </svelte:component>
{/if}
`,
  'Tooltip.svelte': `<script>
  import { onDestroy, onMount } from 'svelte';
  import { createPopper } from '@popperjs/core';
  import classnames, { uuid } from './utils';
  import InlineContainer from './InlineContainer.svelte';
  import Portal from './Portal.svelte';

  let className = '';
  export { className as class };
  export let animation = true;
  export let children = undefined;
  export let container = undefined;
  export let id = \`tooltip_\${uuid()}\`;
  export let isOpen = false;
  export let placement = 'top';
  export let target = '';
  let bsPlacement;
  let popperInstance;
  let popperPlacement = placement;
  let targetEl;
  let tooltipEl;

  const checkPopperPlacement = {
    name: 'checkPopperPlacement',
    enabled: true,
    phase: 'main',
    fn({ state }) {
      popperPlacement = state.placement;
    }
  };

  $: {
    if (isOpen && tooltipEl) {
      popperInstance = createPopper(targetEl, tooltipEl, {
        placement,
        modifiers: [checkPopperPlacement]
      });
    } else if (popperInstance) {
      popperInstance.destroy();
      popperInstance = undefined;
    }
  }

  const open = () => (isOpen = true);
  const close = () => (isOpen = false);

  onMount(registerEventListeners);
  onDestroy(unregisterEventListeners);

  $: if (target) {
    unregisterEventListeners();
    registerEventListeners();
  }

  function registerEventListeners() {
    if (target == null || target.length == 0) {
      targetEl = null;
      return;
    }

    try {
      if (target instanceof HTMLElement) {
        targetEl = target;
      }
    } catch (e) {
      // fails on SSR
    }

    if (targetEl == null) {
      try {
        targetEl = document.querySelector(\`#\${target}\`);
      } catch (e) {
        // fails on SSR
      }
    }

    if (targetEl) {
      targetEl.addEventListener('mouseover', open);
      targetEl.addEventListener('mouseleave', close);
      targetEl.addEventListener('focus', open);
      targetEl.addEventListener('blur', close);
    }
  }

  function unregisterEventListeners() {
    if (targetEl) {
      targetEl.removeEventListener('mouseover', open);
      targetEl.removeEventListener('mouseleave', close);
      targetEl.removeEventListener('focus', open);
      targetEl.removeEventListener('blur', close);
      targetEl.removeAttribute('aria-describedby');
    }
  }

  $: if (targetEl) {
    if (isOpen) targetEl.setAttribute('aria-describedby', id);
    else targetEl.removeAttribute('aria-describedby');
  }

  $: {
    if (popperPlacement === 'left') bsPlacement = 'start';
    else if (popperPlacement === 'right') bsPlacement = 'end';
    else bsPlacement = popperPlacement;
  }

  $: classes = classnames(
    className,
    'tooltip',
    animation ? 'fade' : false,
    \`bs-tooltip-\${bsPlacement}\`,
    isOpen ? 'show' : false
  );

  $: outer = container === 'inline' ? InlineContainer : Portal;
</script>

{#if isOpen}
  <svelte:component this={outer}>
    <div
      bind:this={tooltipEl}
      {...$$restProps}
      class={classes}
      {id}
      role="tooltip"
      x-placement={popperPlacement}
    >
      <div class="tooltip-arrow" data-popper-arrow></div>
      <div class="tooltip-inner">
        {#if typeof children === 'function'}
          {@render children()}
        {:else if children != null}
          {children}
        {/if}
      </div>
    </div>
  </svelte:component>
{/if}
`
};

if (!fs.existsSync(sveltestrapSrc)) {
  process.exit(0);
}

for (const [file, contents] of Object.entries(fileContents)) {
  const filePath = path.join(sveltestrapSrc, file);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  if (fs.readFileSync(filePath, 'utf8') !== contents) {
    fs.writeFileSync(filePath, contents);
  }
}
