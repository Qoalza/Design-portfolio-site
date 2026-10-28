import {runtimeProjectDocuments} from './project-page/runtime-documents.mjs';
import React from 'react';
import {createRoot} from 'react-dom/client';
import App,{CustomCursor} from './App';
import {Routing404} from './Routing404';
import {CorvoProjectPage} from './project-page/CorvoProjectPage';
import {SarafanProjectPage} from './project-page/SarafanProjectPage';
import {BoffProjectPage} from './project-page/BoffProjectPage';
import {projectDetailForPath} from './project-page/project-view-model.mjs';
import {FirstVisit} from './FirstVisit';
import {SmoothScroll} from './SmoothScroll';
import './style.css';
import './v2/tokens.css';

export function mountApplication({onError}){
const projectDocuments=runtimeProjectDocuments([],document.getElementById('portfolio-projects'),{required:true});
const pathname=location.pathname.replace(/\/$/,'')||'/';
const project=projectDetailForPath(projectDocuments,pathname);
const corvo=project?.designProfile==='corvo-v1'&&project;
const sarafan=project?.designProfile==='sarafan-v1'&&project;
const boff=pathname==='/projects/boff';
if(boff)document.title='B.Off — Product Designer';
history.scrollRestoration='manual';
window.scrollTo({top:0,left:0,behavior:'instant'});
if(!boff&&!corvo&&!sarafan&&pathname!=='/')window.__CONCEPT_EARLY_PRELOADER__?.dispose();

const root=createRoot(document.getElementById('root'),{onUncaughtError:onError});
try{root.render(<React.StrictMode>
  <SmoothScroll/>
  {corvo?<FirstVisit><CustomCursor/><CorvoProjectPage project={corvo}/></FirstVisit>
    :sarafan?<FirstVisit><CustomCursor/><SarafanProjectPage project={sarafan}/></FirstVisit>
      :boff?<FirstVisit><CustomCursor/><BoffProjectPage/></FirstVisit>
      :pathname==='/'?<FirstVisit><App projects={projectDocuments}/></FirstVisit>:<Routing404/>}
</React.StrictMode>);}
catch(error){root.unmount();throw error;}
let disposed=false;
const dispose=()=>{if(disposed)return;disposed=true;root.unmount();};
if(import.meta.hot)import.meta.hot.dispose(dispose);
return dispose;
}
