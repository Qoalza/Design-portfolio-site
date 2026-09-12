import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';
import './v2/tokens.css';
import {SmoothScroll} from './SmoothScroll';
import './responsive.css';
// A reload is a fresh visit to Hero, not restoration of a previous section.
history.scrollRestoration='manual';
if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
window.scrollTo({top:0,left:0,behavior:'instant'});
createRoot(document.getElementById('root')).render(<React.StrictMode><SmoothScroll/><App/></React.StrictMode>);
