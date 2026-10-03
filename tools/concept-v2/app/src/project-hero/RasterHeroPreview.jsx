import {ProjectRasterHero} from './ProjectRasterHero.jsx';
import {sarafanRasterHero} from './raster-definition.mjs';
import styles from './RasterHeroPreview.module.css';

export function RasterHeroPreview() {
  return <main className={styles.preview}><ProjectRasterHero definition={sarafanRasterHero} /></main>;
}
