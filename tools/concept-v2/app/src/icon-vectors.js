import home from '../public/figma/imgColor.svg?raw';
import lock from '../public/figma/imgColor1.svg?raw';
import telegram from '../public/figma/imgColor2.svg?raw';
import download from '../public/figma/imgColor3.svg?raw';
import file05 from '../public/figma/file-05.svg?raw';
import search from '../public/figma/imgColor4.svg?raw';
import chevronDown from '../public/figma/imgColor5.svg?raw';
import chevronRight from '../public/figma/imgColor6.svg?raw';
import projectFigma from '../public/figma/project-figma.svg?raw';
import corrupted from '../public/figma/imgColor8.svg?raw';
import chevronLeft from '../public/figma/about-chevron-left.svg?raw';
import aboutChevronRight from '../public/figma/about-chevron-right.svg?raw';
import searchScale from '../public/figma/about-search-scale.svg?raw';
import close from '../public/figma/about-x.svg?raw';
import document from '../public/assets/document.svg?raw';
import analytics from '../public/assets/analytics.svg?raw';
import flow from '../public/assets/flow.svg?raw';
import design from '../public/assets/design.svg?raw';
import code from '../public/assets/code.svg?raw';
import check from '../public/assets/check.svg?raw';
import launch from '../public/assets/launch.svg?raw';
import preloaderRefresh from '../public/figma/preloader-refresh.svg?raw';
import corvoHome from '../public/figma/project-corvo/header/header-home.svg?raw';
import corvoLock from '../public/figma/project-corvo/header/header-lock.svg?raw';
import corvoTelegram from '../public/figma/project-corvo/header/header-telegram.svg?raw';
import corvoFooter from '../public/figma/project-corvo/footer-corrupted.svg?raw';

function asControlColor(svg){
 return svg.replaceAll('#E2E2EC','currentColor').replaceAll('white','currentColor');
}

const icons={
 imgColor:home,
 imgColor1:lock,
 imgColor2:telegram,
 imgColor3:download,
 file05,
 imgColor4:search,
 imgColor5:chevronDown,
 imgColor6:chevronRight,
 imgColor7:projectFigma,
 imgColor8:corrupted,
 'about-chevron-left':chevronLeft,
 'about-chevron-right':aboutChevronRight,
 'about-search-scale':searchScale,
 'about-x':close,
 'hero-search':search,
 'hero-document':document,
 'hero-analytics':analytics,
 'hero-flow':flow,
 'hero-design':design,
 'hero-tools':code,
 'hero-check':check,
 'hero-launch':launch,
 'preloader-refresh':preloaderRefresh,
 'corvo-home':corvoHome,
 'corvo-lock':corvoLock,
 'corvo-telegram':corvoTelegram,
 'corvo-footer':corvoFooter,
};

export function inlineIconSvg(name){
 const svg=icons[name];
 return svg?{__html:asControlColor(svg)}:null;
}
