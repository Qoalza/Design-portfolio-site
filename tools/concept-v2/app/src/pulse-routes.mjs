// Same geometry as the visible network, split at its actual nodes.
const a='H258 Q284 163.333 284 189 V240';
const b='H333 Q354 240 354 263 V291 Q354 314.667 378 314.667 H495';
const c='H671 Q692 314.667 692 337 V467 Q692 490.667 716 490.667 H791';
export const pulseRoutes=[
 {from:'document',to:'analytics',d:`M135 163.333 ${a}`},
 {from:'analytics',to:'design',d:`M284 240 ${b}`},
 {from:'design',to:'launch',d:`M495 314.667 ${c}`},
 {from:'document',to:'design',d:`M135 163.333 ${a} ${b}`},
 {from:'analytics',to:'launch',d:`M284 240 ${b} ${c}`},
 {from:'document',to:'launch',d:`M135 163.333 ${a} ${b} ${c}`},
 {from:'design',to:'flow',d:'M495 314.667 V390 Q495 410 474 410 H369 Q345 410 345 435 V445 Q345 468 322 468 H193'},
 {from:'tools',to:'check',d:'M704 128.667 H800 Q826 128.667 826 155 V260 Q826 284.667 850 284.667 H867'},
];
// Matches the former short upper-right pulse's typical visible speed.
export const PULSE_SPEED=160; // CSS pixels per second
export const TAIL_PIXELS=64;
export function pulseTiming(length,scale=1){
 const tail=TAIL_PIXELS/scale;
 return {tail,duration:(length*scale+TAIL_PIXELS)/PULSE_SPEED*1000};
}
