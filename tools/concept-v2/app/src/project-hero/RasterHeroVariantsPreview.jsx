import {useState} from 'react';
import {ProjectRasterHero} from './ProjectRasterHero.jsx';
import {sarafanRasterHero} from './raster-definition.mjs';
import {rasterPreviewVariants, rasterVariantDefinition} from './raster-variants.mjs';
import styles from './RasterHeroVariantsPreview.module.css';

function initialVariant() {
  const requested = new URLSearchParams(location.search).get('count');
  return rasterPreviewVariants.some(variant => variant.id === requested) ? requested : '3';
}

export function RasterHeroVariantsPreview() {
  const [variantId, setVariantId] = useState(initialVariant);
  const definition = rasterVariantDefinition(sarafanRasterHero, variantId);

  function selectVariant(id) {
    if (id === variantId) return;
    setVariantId(id);
    const url = new URL(location.href);
    url.searchParams.set('count', id);
    history.replaceState(history.state, '', url);
  }

  return (
    <main className={styles.preview}>
      <ProjectRasterHero key={variantId} definition={definition} />
      <div className={styles.toolbar} aria-label="Варианты количества изображений">
        <p className={styles.label}>Изображений в Hero</p>
        <div className={styles.options} role="group" aria-label="Выбрать количество изображений">
          {rasterPreviewVariants.map(variant => <button
            key={variant.id}
            type="button"
            className={variant.id === variantId ? styles.selected : ''}
            aria-pressed={variant.id === variantId}
            onClick={() => selectVariant(variant.id)}
          >{variant.id}</button>)}
        </div>
        <p className={styles.note}>В 5+ показано 7 позиций. После третьей растр повторяется для проверки листания.</p>
      </div>
    </main>
  );
}
