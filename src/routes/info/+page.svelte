<script lang="ts">
  import { base } from '$app/paths';
  import { Accordion, AccordionItem, Icon } from 'sveltestrap';
  import WorkspaceContentView from '$components/workspace-content-view.svelte';
  import WorkspaceShell from '$components/workspace-shell.svelte';
  import InfoContent from '../../content/info.svx';
  import ThanksAndLicensesContent from '../../content/thanks-and-licenses.svx';
</script>

<WorkspaceShell view="info">
  <WorkspaceContentView>
    <section class="docs-hero">
      <a class="docs-close-button" href={`${base}/`} aria-label="Close info">
        <Icon name="x-lg" />
      </a>
      <div class="docs-hero-header">
        <img class="docs-logo" src={`${base}/logo_512.png`} alt="RPG Cards logo" />
        <div class="docs-hero-text">
          <h1 class="docs-hero-title">Info</h1>
          <p class="docs-hero-copy">
            Background, credits, and project notes for the RPG Cards Generator.
          </p>
        </div>
      </div>
    </section>

    <div class="info-callout">
      <InfoContent />
    </div>

    <section class="docs-section">
      <Accordion flush>
        <AccordionItem header="Thanks and licenses">
          <ThanksAndLicensesContent />
        </AccordionItem>
      </Accordion>
    </section>
  </WorkspaceContentView>
</WorkspaceShell>
