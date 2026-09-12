export const nodes = [
  [13.5,24.5,'document','Изучение задачи','circle'],
  [28.4,36,'analytics','Анализ данных','square'],
  [19.3,70.2,'flow','Пользовательские сценарии','circle'],
  [49.5,47.2,'design','Проектирование','circle'],
  [70.4,19.3,'tools','Передача в разработку','diamond'],
  [86.7,42.7,'check','Проверка решения','square'],
  [79.1,73.6,'launch','Запуск и развитие','diamond'],
];
export const WIDTH=1000;
export const HEIGHT=2000/3;
export const STROKE=1.2;
export function position(node){return {x:node[0]*WIDTH/100,y:node[1]*HEIGHT/100};}
export function glyph(shape,x,y,size){
  if(shape==='circle')return {tag:'circle',props:{cx:x,cy:y,r:size/2}};
  if(shape==='square')return {tag:'rect',props:{x:x-size/2,y:y-size/2,width:size,height:size}};
  if(shape==='diamond')return {tag:'path',props:{d:`M ${x} ${y-size/2} L ${x+size/2} ${y} L ${x} ${y+size/2} L ${x-size/2} ${y} Z`}};
  throw new Error(`Unknown node shape: ${shape}`);
}
export const routes=[
  'M135 163.333 H258 Q284 163.333 284 189 V240 H333 Q354 240 354 263 V291 Q354 314.667 378 314.667 H671 Q692 314.667 692 337 V467 Q692 490.667 716 490.667 H791',
  'M495 314.667 V390 Q495 410 474 410 H369 Q345 410 345 435 V445 Q345 468 322 468 H193',
  'M704 128.667 H800 Q826 128.667 826 155 V260 Q826 284.667 850 284.667 H867',
];
