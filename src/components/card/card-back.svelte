<script lang="ts">
  import type Card from '$model/card';
  import type { CardBackImage } from '$model/card';
  import { pageLayout } from '../../stores';
  import Icon from '../game-icon.svelte';
  export let card: Card;

  const createLayeredBackground = (images: CardBackImage[]) => {
    if (!images?.length) {
      return '';
    }

    const orderedImages = [...images].reverse();
    const urls = orderedImages.map((image) => `url('${image.src}')`).join(', ');
    const sizes = orderedImages.map((image) => image.size || 'contain').join(', ');
    const positions = orderedImages.map(() => 'center center').join(', ');
    const repeats = orderedImages.map(() => 'no-repeat').join(', ');

    return [
      `background-image: ${urls};`,
      `background-size: ${sizes};`,
      `background-position: ${positions};`,
      `background-repeat: ${repeats};`
    ].join(' ');
  };

  $: cardbackMode = card?.cardback_mode ?? 'icon';
  $: cardbackImages = card?.cardback_images ?? [];
  $: cardbackImageStyle = createLayeredBackground(cardbackImages);
  $: cardbackBorderStyle = card?.cardback_border_style ?? 'normal';
</script>

<div
  class="rpg-card-wrapper"
  class:no-cardback-border={cardbackBorderStyle === 'none'}
  style="
    --card-color: {card.color};
    --card-text-size: {card?.layout?.text_font_size ? card?.layout?.text_font_size : '10px'};
    --card-width: {$pageLayout.cardSize.width}mm;
    --card-height: {$pageLayout.cardSize.height}mm;
  "
>
  <div class="rpg-card" class:rpg-card-images={cardbackMode === 'images'}>
    {#if cardbackMode === 'images'}
      <div
        class="image-surface"
        style={`background-color: ${card.cardback_background_color ?? 'var(--color-surface-base)'}; ${cardbackImageStyle}`}
      ></div>
    {:else}
      <div class="line">
        <div class="content-top">
          <div class="content">
            <p>{card.text_back ?? ''}</p>
          </div>
        </div>
        <div class="icon-wrapper">
          <Icon name={card.icon_back} size="5rem" />
        </div>
        <div class="content-bottom">
          <div class="content">
            <p>{card.text_back ?? ''}</p>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  $border-width: 0.3cm;
  $border-radius: 0.25cm;

  .rpg-card-wrapper {
    width: var(--card-width);
    height: var(--card-height);
    background-color: var(--card-color);

    box-sizing: border-box;
    border: $border-width solid var(--card-color);
    border-radius: $border-radius;
    background-color: var(--card-color);
  }

  .rpg-card-wrapper.no-cardback-border {
    border-width: 0;
  }

  .rpg-card {
    height: 100%;
    border-radius: $border-radius;
    padding: 0.75em;
    background: radial-gradient(ellipse at center, white 20%, var(--card-color) 120%);
    overflow: hidden;
  }

  .rpg-card.rpg-card-images {
    padding: 0;
  }

  .image-surface {
    width: 100%;
    height: 100%;
    border-radius: calc(#{$border-radius} - 0.1em);
    background-color: white;
  }

  .icon-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--card-color);
    padding: 1em;
    border-radius: 1em;
  }

  .line {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    height: 100%;
    width: 100%;
    border: 0.25em solid var(--card-color);
    border-radius: $border-radius;
  }

  .content-top {
    display: flex;
    width: 100%;
    justify-content: end;
  }

  .content-bottom {
    display: flex;
    width: 100%;
    justify-content: start;
  }

  .content {
    /* width: 4em; */
    height: 4em;
    display: flex;
    justify-content: center;
    align-items: center;

    overflow: hidden;

    p {
      margin: 0 0.75rem;
      padding: 0;
      font-size: 4em;
      font-weight: bold;
      color: var(--card-color);
      max-lines: 1;
      font-family: Draconis;
    }
  }
</style>
