import {ProjectResponsiveHero} from './ProjectResponsiveHero';
import {corvoResponsiveHero} from './definition.mjs';
import styles from './ResponsiveHeroPreview.module.css';

export function ResponsiveHeroPreview(){
 return <main className={styles.preview}><ProjectResponsiveHero definition={corvoResponsiveHero}/></main>;
}
