import {boffProject} from './project-page/boff-content.mjs';

// Portfolio-only composition; canonical/Admin project documents are unchanged.
export function featuredProjectCards(cards,base='/'){
 const byId=new Map(cards.map(card=>[card.id,card]));
 byId.set('boff',{
  id:'boff',title:'B.Off',categories:['B2B','FinTech','Back Office'],
  description:'B.Off — B2B-система для работы с кастодиальными кошельками, криптовалютными платежами и мерчантами. Объединяет финансовые операции, мониторинг, отчётность и многое другое.',
  preview:{back:{fallback:'/figma/project-boff/transactions.png',sources:[]},front:{fallback:'/figma/project-boff/account.png',sources:[]},ariaLabel:'Интерфейс B.Off',frontAlt:'Счета и балансы кастодиальных кошельков B.Off'},
  actions:{details:{href:`${base}projects/boff`},figma:{href:boffProject.figmaHref}},
 });
 return ['corvo','boff','sarafan-radio'].map(id=>byId.get(id)).filter(Boolean);
}
