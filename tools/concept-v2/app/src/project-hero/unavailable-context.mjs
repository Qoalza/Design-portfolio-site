const descriptions={
 tablet:'Для этой работы не предусмотрена планшетная версия',
 mobile:'Для этой работы не предусмотрена мобильная версия',
};
export function unavailableContextHint(context){
 const description=!context.slides.length&&descriptions[context.id];
 return description?{title:`${context.label} – недоступен`,description}:null;
}
