const criticalFamilies=new Set(['Onest','Google Sans']);
let retrySequence=0;
const familyName=value=>value.trim().replace(/^["']|["']$/g,'');

export function refreshFailedFontSources(document,baseUrl){
  const failed=new Set();
  document.fonts.forEach(face=>{
    const family=familyName(face.family);
    if(face.status==='error'&&criticalFamilies.has(family))failed.add(family);
  });
  if(!failed.size)return 0;
  const sequence=++retrySequence;
  let refreshed=0;
  for(const sheet of document.styleSheets){
    let rules;try{rules=sheet.cssRules;}catch{continue;}
    for(const rule of rules){
      if(!rule.style||!failed.has(familyName(rule.style.getPropertyValue('font-family'))))continue;
      const source=rule.style.getPropertyValue('src');
      if(!source)continue;
      const renewed=source.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/g,(_match,_quote,value)=>{
        const url=new URL(value.trim(),baseUrl);
        url.searchParams.set('preloader-retry',String(sequence));
        return `url("${url.href}")`;
      });
      if(renewed!==source){rule.style.setProperty('src',renewed);refreshed+=1;}
    }
  }
  return refreshed;
}
