// One wide artwork for every share-preview consumer.
export const socialPreviewImages=Object.freeze([
 {path:'/artur-designer-social-preview-v3.png',width:1200,height:630},
]);
export const socialPreviewAlt='Артур — Senior продуктовый дизайнер. Тёмная обложка с логотипом и графикой маршрута.';
export const socialPreviewPublicFiles=[...socialPreviewImages.map(image=>'public'+image.path),'public/artur-designer-social-preview-v2.png'];
