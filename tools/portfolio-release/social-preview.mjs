// Ordered Open Graph candidates: the wide artwork is preferred. Consumers choose
// their presentation; a second image does not force compact clients to use it.
export const socialPreviewImages=Object.freeze([
 {path:'/artur-designer-social-preview-v3.png',width:1200,height:630},
 {path:'/artur-designer-social-preview-square-v3.png',width:640,height:640},
]);
export const socialPreviewAlt='Артур — Senior продуктовый дизайнер. Тёмная обложка с логотипом и графикой маршрута.';
export const socialPreviewPublicFiles=[...socialPreviewImages.map(image=>'public'+image.path),'public/artur-designer-social-preview-v2.png','public/artur-designer-social-preview-square-v2.png'];
