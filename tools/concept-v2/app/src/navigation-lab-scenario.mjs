export const LAB_PRESETS={
  cycle:{label:'Цикл · долгая / обрыв'},
  fast:{label:'Быстро · до 200 мс',delay:0},
  pending:{label:'Ожидание · 400 мс',delay:400},
  slow:{label:'Долго · 20 с',delay:20000},
  connection:{label:'Обрыв соединения',delay:400,error:true},
};

export function resolveLabAttempt(preset,attemptIndex){
  if(preset==='cycle')return attemptIndex%2===0?{kind:'pending'}:{kind:'connection',delay:9500};
  const selected=LAB_PRESETS[preset];
  return {kind:selected.error?'connection':'ready',delay:selected.delay};
}
