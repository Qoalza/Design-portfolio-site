import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';
import './v2/tokens.css';
import {SmoothScroll} from './SmoothScroll';
import {Preloader} from './Preloader';
import {FirstVisit} from './FirstVisit';
import './responsive.css';
const isPreloader=location.pathname.replace(/\/$/,'')==='/preloader';
if(!isPreloader){
  // A reload is a fresh visit to Hero, not restoration of a previous section.
  history.scrollRestoration='manual';
  if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
  window.scrollTo({top:0,left:0,behavior:'instant'});
}
document.title=isPreloader?'Прелоадер · Concept V.2':'Артур — Product Designer · Concept V.2';
createRoot(document.getElementById('root')).render(<React.StrictMode>{isPreloader?<Preloader/>:<FirstVisit><SmoothScroll/><App/></FirstVisit>}</React.StrictMode>);
