const assetRoot='/assets/projects/corvo/responsive-hero';

export const corvoResponsiveHero={
 kind:'responsive-viewer',
 sceneSetId:'corvo-v1',
 sceneSrc:'/responsive-scenes/corvo-v1/media-campaigns/index.html',
 chromeAssetRoot:assetRoot,
 initialSceneId:'media-campaigns',
 scenes:[
  {id:'media-campaigns',label:'Media Campaigns',iconSrc:`${assetRoot}/tab-media-campaigns.svg`,tabWidth:150},
  {id:'statistics',label:'Statistics',iconSrc:`${assetRoot}/tab-statistics.svg`,tabWidth:96},
  {id:'my-space',label:'My Space',iconSrc:`${assetRoot}/tab-my-space.svg`,tabWidth:101},
  {id:'authorization',label:'Authorization',iconSrc:`${assetRoot}/tab-authorization.svg`,tabWidth:123}
 ]
};
