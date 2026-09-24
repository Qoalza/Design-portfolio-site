import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {Routing404} from './Routing404';
import './style.css';
import './v2/tokens.css';
import {SmoothScroll} from './SmoothScroll';
import './responsive.css';
// A reload is a fresh visit to Hero, not restoration of a previous section.
const basePath=import.meta.env.BASE_URL.replace(/\/$/,'');
const pagePath=location.pathname.startsWith(basePath)?location.pathname.slice(basePath.length)||'/':location.pathname;
const is404=pagePath.replace(/\/$/,'')==='/404'||pagePath.replace(/\/$/,'')!=='';
history.scrollRestoration='manual';
if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
window.scrollTo({top:0,left:0,behavior:'instant'});
document.title=is404?'404 · Concept V.2':'Артур — Product Designer · Concept V.2';
createRoot(document.getElementById('root')).render(<React.StrictMode>{is404?<Routing404/>:<><SmoothScroll/><App/></>}</React.StrictMode>);
