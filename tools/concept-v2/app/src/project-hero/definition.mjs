const assetRoot='/assets/projects/corvo/responsive-hero';

export const corvoResponsiveHero={
 kind:'responsive-viewer',
 sceneSetId:'corvo-v1',
 chromeAssetRoot:assetRoot,
 initialSceneId:'media-campaigns',
 scenes:[
  {id:'media-campaigns',label:'Media Campaigns',icon:'scenario-media',tabWidth:146,src:'/responsive-scenes/corvo-v1/media-campaigns/index.html'},
  {id:'statistics',label:'Statistics',icon:'scenario-statistics',tabWidth:92,src:'/responsive-scenes/corvo-v1/statistics/index.html'},
  {id:'my-space',label:'My Space',icon:'scenario-space',tabWidth:97,src:'/responsive-scenes/corvo-v1/my-space/index.html'},
  {id:'authorization',label:'Authorization',icon:'scenario-auth',tabWidth:119,src:'/responsive-scenes/corvo-v1/authorization/index.html'}
 ]
};
