// Portfolio-only presentation: canonical titles remain available to the compact Hero.
export const sarafanDesktopCaptions = {
 delivery:{title:'Выбранный заказ',description:'Настройка выбранного товара'},
 home:{title:'Оформление заказа',description:'Список товаров и сводка заказа'},
 variant:{title:'Выбранный вариант',description:'Настройка конкретного варианта товара'},
};

export function desktopRasterSlides(definition,context){
 if((context.slides.length !== 3 && context.slides.length < 5) || !definition.desktopCaptions)return context.slides;
 return context.slides.map(slide=>{
  const caption=definition.desktopCaptions[slide.id];
  return caption?{...slide,...caption}:slide;
 });
}
