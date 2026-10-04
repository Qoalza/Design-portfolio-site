const assetRoot = '/assets/projects/sarafan-radio/raster-hero';

export const sarafanRasterHero = {
  projectName: 'Сараффан.Радио',
  initialContextId: 'desktop',
  contexts: [
    {
      id: 'desktop',
      label: 'Desktop',
      icon: 'size-desktop',
      initialSlideId: 'home',
      slides: [
        {id: 'delivery', title: 'Настройка доставки', src: `${assetRoot}/delivery.png`},
        {id: 'home', title: 'Главная страница', src: `${assetRoot}/main.png`},
        {id: 'variant', title: 'Настройка выбранного варианта', src: `${assetRoot}/variant.png`},
      ],
    },
    {id: 'tablet', label: 'Tablet', icon: 'size-tablet', slides: []},
    {id: 'mobile', label: 'Mobile', icon: 'size-mobile', slides: []},
  ],
};
