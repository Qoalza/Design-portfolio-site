// Ordered Open Graph candidates: the wide artwork is preferred. Consumers choose
// their presentation; a second image does not force compact clients to use it.
export const socialPreviewImages=Object.freeze([
 {path:'/artur-designer-social-preview-v2.png',width:2400,height:1260},
 {path:'/artur-designer-social-preview-square-v2.png',width:1280,height:1280},
]);
export const socialPreviewAlt='Артур — Senior продуктовый дизайнер. Тёмная обложка с логотипом и графикой маршрута.';
export const socialPreviewPublicFiles=socialPreviewImages.map(image=>'public'+image.path);
