<script lang="ts">
  import { base } from '$app/paths';
  import { cloneTemplateCard, loadCardTemplate } from '$lib/card-template-builder';
  import { CARD_TEMPLATES } from '$lib/card-templates';
  import { getContentAsString } from '../lib/card-json-parser';
  import type Card from '../model/card';
  import { settings } from '../stores/settings';
  import { createEventDispatcher } from 'svelte';
  import { Button, Input, Label } from 'sveltestrap';
  import SidebarSection from './sidebar-section.svelte';

  const dispatch = createEventDispatcher<{
    complete: { card: Card; textFieldContent: string };
  }>();

  export let initialName = '';

  let wizardName = initialName;
  let wizardNameError = '';
  let selectedTemplateId = '';
  let wizardError = '';
  let isApplyingTemplate = false;

  const handleCompleteWizard = async () => {
    const nextTitle = wizardName.trim();

    if (!nextTitle) {
      wizardNameError = 'Please enter a name for your card.';
      return;
    }

    wizardNameError = '';

    if (!selectedTemplateId) {
      return;
    }

    wizardError = '';
    isApplyingTemplate = true;

    try {
      const templateDefinition = CARD_TEMPLATES.find((template) => template.id === selectedTemplateId);

      if (!templateDefinition) {
        wizardError = 'Choose a valid starting point before continuing.';
        return;
      }

      const templateCard = await loadCardTemplate(templateDefinition, {
        base,
        convertFirstSubtitle: $settings.convertFirstSubtitle,
        convertDndSpellblock: $settings.convertDndSpellblock
      });

      if (!templateCard) {
        wizardError = 'This template did not contain a usable card.';
        return;
      }

      const card = cloneTemplateCard(templateCard, nextTitle);
      dispatch('complete', { card, textFieldContent: getContentAsString(card.contents) });
    } catch (error) {
      console.error(error);
      wizardError = 'The selected template could not be loaded.';
    } finally {
      isApplyingTemplate = false;
    }
  };
</script>

<div class="card-setup-wizard">
  <div class="wizard-hero">
    <img class="wizard-logo" src={`${base}/logo_512.png`} alt="RPG Cards logo" />
    <div class="wizard-copy">
      <h2 class="wizard-title">Create a new card</h2>
      <p class="wizard-text">
        Give your card a name, then choose whether to begin from a project template or a clean
        starter card.
      </p>
    </div>
  </div>

  <SidebarSection title="Card setup">
    <div class="sidebar-field">
      <Label class="col-form-label" for="wizard-card-name">Card name</Label>
      <Input
        id="wizard-card-name"
        type="text"
        bind:value={wizardName}
        invalid={Boolean(wizardNameError)}
        placeholder="Enter card name"
        on:input={() => {
          if (wizardNameError && wizardName.trim()) {
            wizardNameError = '';
          }
        }}
        on:keydown={(event) => {
          if (event.key === 'Enter' && selectedTemplateId) {
            event.preventDefault();
            void handleCompleteWizard();
          }
        }}
      />
      {#if wizardNameError}
        <div class="wizard-field-error" role="alert">{wizardNameError}</div>
      {/if}
    </div>

    <div class="sidebar-field">
      <div class="wizard-choice-label">Choose how to start</div>
      <div class="wizard-choice-grid" role="radiogroup" aria-label="Card template choice">
        {#each CARD_TEMPLATES as template}
          <button
            type="button"
            class={`wizard-choice-card ${selectedTemplateId === template.id ? 'wizard-choice-card-active' : ''}`}
            aria-pressed={selectedTemplateId === template.id}
            on:click={() => (selectedTemplateId = template.id)}
          >
            <span class="wizard-choice-title">{template.label}</span>
            <span class="wizard-choice-description">{template.description}</span>
          </button>
        {/each}
      </div>
    </div>

    {#if wizardError}
      <div class="wizard-error" role="alert">{wizardError}</div>
    {/if}

    <div class="wizard-actions">
      <Button
        type="button"
        color="primary"
        disabled={!selectedTemplateId || isApplyingTemplate}
        on:click={handleCompleteWizard}
      >
        {isApplyingTemplate ? 'Preparing...' : 'Continue'}
      </Button>
    </div>
  </SidebarSection>
</div>

<style lang="scss">
  .card-setup-wizard {
    --card-setup-wizard-text-primary: var(--color-ink-900);
    --card-setup-wizard-text-muted: var(--color-ink-575);
    --card-setup-wizard-text-danger: var(--color-danger);
    --card-setup-wizard-border-soft: var(--color-border-soft);
    --card-setup-wizard-border-medium: var(--color-border-medium);
    --card-setup-wizard-border-intense: var(--color-border-intense);
    --card-setup-wizard-danger-border: var(--color-danger-border);
    --card-setup-wizard-danger-surface: var(--color-danger-surface);
    --card-setup-wizard-accent-border: var(--color-accent-border);
    --card-setup-wizard-accent-shadow: var(--color-accent-shadow);
    --card-setup-wizard-surface: #faf8f3;
    --card-setup-wizard-surface-hover: #f6f1e7;
    --card-setup-wizard-surface-active: #efe6d3;
    --card-setup-wizard-hero-glow: rgba(244, 239, 228, 0.95);
    --card-setup-wizard-hero-surface: var(--color-white-98);
    --card-setup-wizard-shadow-strong: var(--color-shadow-300);
    --card-setup-wizard-surface-base: var(--color-surface-base);

    display: grid;
    gap: 1rem;
  }

  .wizard-hero {
    padding: 1rem;
    display: grid;
    gap: 0.85rem;
    justify-items: center;
    border: 1px solid var(--card-setup-wizard-border-soft);
    border-radius: 1rem;
    background:
      linear-gradient(
        180deg,
        var(--card-setup-wizard-hero-glow),
        var(--card-setup-wizard-hero-surface)
      ),
      var(--card-setup-wizard-surface-base);
    text-align: center;
  }

  .wizard-logo {
    width: 4.75rem;
    height: 4.75rem;
    display: block;
    object-fit: contain;
    filter: drop-shadow(0 8px 18px var(--card-setup-wizard-shadow-strong));
  }

  .wizard-copy {
    display: grid;
    gap: 0.35rem;
  }

  .wizard-title {
    margin: 0;
    color: var(--card-setup-wizard-text-primary);
    font-size: 1.15rem;
    font-weight: 700;
  }

  .wizard-text {
    margin: 0;
    color: var(--card-setup-wizard-text-muted);
    font-size: 0.86rem;
    line-height: 1.5;
  }

  .wizard-choice-label {
    margin-bottom: 0.45rem;
    color: var(--card-setup-wizard-text-primary);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .wizard-field-error {
    margin-top: 0.35rem;
    color: var(--card-setup-wizard-text-danger);
    font-size: 0.76rem;
    line-height: 1.4;
  }

  .wizard-choice-grid {
    display: grid;
    gap: 0.6rem;
  }

  .wizard-choice-card {
    padding: 0.8rem 0.85rem;
    display: grid;
    gap: 0.25rem;
    text-align: left;
    border: 1px solid var(--card-setup-wizard-border-medium);
    border-radius: 0.8rem;
    background: var(--card-setup-wizard-surface);
    color: var(--card-setup-wizard-text-primary);
    transition:
      border-color 120ms ease,
      background-color 120ms ease,
      box-shadow 120ms ease,
      transform 120ms ease;
  }

  .wizard-choice-card:hover {
    background: var(--card-setup-wizard-surface-hover);
    border-color: var(--card-setup-wizard-border-intense);
  }

  .wizard-choice-card-active {
    background: var(--card-setup-wizard-surface-active);
    border-color: var(--card-setup-wizard-accent-border);
    box-shadow: 0 0 0 1px var(--card-setup-wizard-accent-shadow);
    transform: translateY(-1px);
  }

  .wizard-choice-title {
    font-size: 0.86rem;
    font-weight: 700;
  }

  .wizard-choice-description {
    color: var(--card-setup-wizard-text-muted);
    font-size: 0.76rem;
    line-height: 1.45;
  }

  .wizard-error {
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--card-setup-wizard-danger-border);
    border-radius: 0.7rem;
    background: var(--card-setup-wizard-danger-surface);
    color: var(--card-setup-wizard-text-danger);
    font-size: 0.78rem;
  }

  .wizard-actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
