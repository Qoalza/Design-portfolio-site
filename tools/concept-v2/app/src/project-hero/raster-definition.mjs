import {sarafanDesktopCaptions} from './raster-desktop-presentation.mjs';

const assetRoot = '/assets/projects/sarafan-radio/raster-hero';

export const sarafanRasterHero = {
  projectName: 'Сараффан.Радио',
  initialContextId: 'desktop',
  desktopCaptions: sarafanDesktopCaptions,
  contexts: [
    {
      id: 'desktop',
      label: 'Desktop',
      icon: 'size-desktop',
      initialSlideId: 'home',
      slides: [
        {id: 'delivery', title: 'Настройка доставки', src: `${assetRoot}/delivery.webp`},
        {id: 'home', title: 'Главная страница', src: `${assetRoot}/main.webp`},
        {id: 'variant', title: 'Настройка выбранного варианта', src: `${assetRoot}/variant.webp`},
      ],
    },
    {id: 'tablet', label: 'Tablet', icon: 'size-tablet', slides: []},
    {id: 'mobile', label: 'Mobile', icon: 'size-mobile', slides: []},
  ],
};
