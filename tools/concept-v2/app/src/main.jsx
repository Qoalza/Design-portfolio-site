import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {Routing404} from './Routing404';
import {ResponsiveHeroPreview} from './project-hero/ResponsiveHeroPreview';
import {Preloader} from './Preloader';
import {FirstVisit} from './FirstVisit';
import {NavigationLab} from './NavigationLab';
import './style.css';
import './v2/tokens.css';
import {SmoothScroll} from './SmoothScroll';
import './responsive.css';

const basePath=import.meta.env.BASE_URL.replace(/\/$/,'');
const pagePath=location.pathname.startsWith(basePath)?location.pathname.slice(basePath.length)||'/':location.pathname;
const normalizedPath=pagePath.replace(/\/$/,'');
const isPreloader=normalizedPath==='/preloader';
const isNavigationLab=normalizedPath==='/navigation-lab';
const isResponsiveHero=normalizedPath==='/preview/project-responsive-hero';
const is404=!isPreloader&&!isNavigationLab&&!isResponsiveHero&&(normalizedPath==='/404'||normalizedPath!=='');

if(!isPreloader&&!isNavigationLab){
  // A reload is a fresh visit to Hero, not restoration of a previous section.
  history.scrollRestoration='manual';
  if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
  window.scrollTo({top:0,left:0,behavior:'instant'});
}

document.title=isResponsiveHero?'Corvo Responsive Hero · Concept V.2'
  :is404?'404 · Concept V.2'
    :isPreloader?'Прелоадер · Concept V.2'
      :isNavigationLab?'Переходы · Concept V.2'
        :'Артур — Product Designer · Concept V.2';

createRoot(document.getElementById('root')).render(<React.StrictMode>
  {isResponsiveHero?<ResponsiveHeroPreview/>
    :is404?<Routing404/>
      :isPreloader?<Preloader/>
        :isNavigationLab?<NavigationLab/>
          :<FirstVisit><SmoothScroll/><App/></FirstVisit>}
</React.StrictMode>);
