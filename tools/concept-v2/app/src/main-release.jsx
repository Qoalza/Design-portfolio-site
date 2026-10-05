import projectDocuments from 'virtual:project-documents';
import React from 'react';
import {createRoot} from 'react-dom/client';
import App,{CustomCursor} from './App';
import {Routing404} from './Routing404';
import {CorvoProjectPage} from './project-page/CorvoProjectPage';
import {SarafanProjectPage} from './project-page/SarafanProjectPage';
import {projectDetailForPath} from './project-page/project-view-model.mjs';
import {FirstVisit} from './FirstVisit';
import {SmoothScroll} from './SmoothScroll';
import './style.css';
import './v2/tokens.css';

const pathname=location.pathname.replace(/\/$/,'')||'/';
const project=projectDetailForPath(projectDocuments,pathname);
const corvo=project?.designProfile==='corvo-v1'&&project;
const sarafan=project?.designProfile==='sarafan-v1'&&project;
history.scrollRestoration='manual';
window.scrollTo({top:0,left:0,behavior:'instant'});
createRoot(document.getElementById('root')).render(<React.StrictMode>
  <SmoothScroll/>
  {corvo?<FirstVisit><CustomCursor/><CorvoProjectPage project={corvo}/></FirstVisit>
    :sarafan?<FirstVisit><CustomCursor/><SarafanProjectPage project={sarafan}/></FirstVisit>
      :pathname==='/'?<FirstVisit><App projects={projectDocuments}/></FirstVisit>:<Routing404/>}
</React.StrictMode>);
