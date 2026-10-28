import approvedDocuments from 'virtual:project-documents';
import React from 'react';
import {projectDetailDocument} from './project-page/project-view-model.mjs';
import {createRoot} from 'react-dom/client';
import App,{CustomCursor} from './App';
import {Routing404} from './Routing404';
import {ResponsiveHeroPreview} from './project-hero/ResponsiveHeroPreview';
import {RasterHeroPreview} from './project-hero/RasterHeroPreview';
import {RasterHeroVariantsPreview} from './project-hero/RasterHeroVariantsPreview';
import {CorvoProjectPage} from './project-page/CorvoProjectPage';
import {SarafanProjectPage} from './project-page/SarafanProjectPage';
import {BoffProjectPage} from './project-page/BoffProjectPage';
import {boffForPath} from './project-page/boff-content.mjs';
import {Preloader} from './Preloader';
import {PreloaderPreview} from './PreloaderPreview';
import {FirstVisit} from './FirstVisit';
import {NavigationLab} from './NavigationLab';
import './style.css';
import './v2/tokens.css';
import {SmoothScroll} from './SmoothScroll';

export function mountApplication({onError}){
const projectDocuments=window.__PORTFOLIO_PROJECT_DOCUMENTS__??approvedDocuments;
const projectBySlug=slug=>projectDetailDocument(projectDocuments,slug);
const basePath=import.meta.env.BASE_URL.replace(/\/$/,'');
const pagePath=location.pathname.startsWith(basePath)?location.pathname.slice(basePath.length)||'/':location.pathname;
const normalizedPath=pagePath.replace(/\/$/,'');
const isPreloader=normalizedPath==='/preloader';
const isPreloaderPreview=normalizedPath==='/preloader-preview';
const isNavigationLab=normalizedPath==='/navigation-lab';
const isResponsiveHero=normalizedPath==='/preview/project-responsive-hero';
const isRasterHero=normalizedPath==='/preview/project-raster-hero';
const isRasterHeroVariants=normalizedPath==='/preview/project-raster-hero-variants';
const isCorvoProject=normalizedPath==='/projects/corvo'&&Boolean(projectBySlug('corvo'));
const isSarafanProject=normalizedPath==='/projects/sarafan-radio'&&Boolean(projectBySlug('sarafan-radio'));
const isBoffProject=Boolean(boffForPath(normalizedPath));
const is404=!isPreloader&&!isPreloaderPreview&&!isNavigationLab&&!isResponsiveHero&&!isRasterHero&&!isRasterHeroVariants&&!isCorvoProject&&!isSarafanProject&&!isBoffProject&&(normalizedPath==='/404'||normalizedPath!=='');

if(!isPreloader&&!isNavigationLab){
  // A reload is a fresh visit to Hero, not restoration of a previous section.
  history.scrollRestoration='manual';
  if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
  window.scrollTo({top:0,left:0,behavior:'instant'});
}

document.title=isCorvoProject?`${projectBySlug('corvo').title} — Product Designer`
  :isSarafanProject?`${projectBySlug('sarafan-radio').title} — Product Designer`
  :isBoffProject?'B.Off — Product Designer'
  :isResponsiveHero?'Corvo Responsive Hero · Concept V.2'
  :isRasterHero?'Сараффан.Радио Raster Hero · Concept V.2'
  :isRasterHeroVariants?'Варианты Raster Hero · Concept V.2'
  :is404?'404 · Concept V.2'
    :isPreloaderPreview?'Состояния прелоадера · Concept V.2'
    :isPreloader?'Прелоадер · Concept V.2'
      :isNavigationLab?'Переходы · Concept V.2'
        :'Артур — Product Designer · Concept V.2';

if(!isCorvoProject&&!isSarafanProject&&!isBoffProject&&normalizedPath!=='')window.__CONCEPT_EARLY_PRELOADER__?.dispose();

const root=createRoot(document.getElementById('root'),{onUncaughtError:onError});
try{root.render(<React.StrictMode>
  <SmoothScroll/>
  {isCorvoProject?<FirstVisit><CustomCursor/><CorvoProjectPage project={projectBySlug('corvo')}/></FirstVisit>
    :isSarafanProject?<FirstVisit><CustomCursor/><SarafanProjectPage project={projectBySlug('sarafan-radio')}/></FirstVisit>
    :isBoffProject?<FirstVisit><CustomCursor/><BoffProjectPage/></FirstVisit>
    :isResponsiveHero?<ResponsiveHeroPreview/>
    :isRasterHero?<RasterHeroPreview/>
    :isRasterHeroVariants?<RasterHeroVariantsPreview/>
    :is404?<Routing404/>
      :isPreloaderPreview?<PreloaderPreview/>
      :isPreloader?<Preloader/>
        :isNavigationLab?<NavigationLab/>
          :<FirstVisit><App projects={projectDocuments}/></FirstVisit>}
</React.StrictMode>);}
catch(error){root.unmount();throw error;}
let disposed=false;
const dispose=()=>{if(disposed)return;disposed=true;root.unmount();};
if(import.meta.hot)import.meta.hot.dispose(dispose);
return dispose;
}
