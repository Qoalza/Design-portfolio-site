const assetRoot='/assets/projects/corvo/responsive-hero';

export const corvoResponsiveHero={
 kind:'responsive-viewer',
 sceneSetId:'corvo-v1',
 sceneSrc:'/responsive-scenes/corvo-v1/media-campaigns/index.html',
 chromeAssetRoot:assetRoot,
 initialSceneId:'media-campaigns',
 scenes:[
  {id:'media-campaigns',label:'Media Campaigns',icon:'scenario-media',tabWidth:146},
  {id:'statistics',label:'Statistics',icon:'scenario-statistics',tabWidth:92},
  {id:'my-space',label:'My Space',icon:'scenario-space',tabWidth:97},
  {id:'authorization',label:'Authorization',icon:'scenario-auth',tabWidth:119}
 ]
};
