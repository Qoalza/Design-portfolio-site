import {Tooltip} from './Tooltip.jsx';

const content={
 blog:{title:'Скоро появится',description:'Дописываю последние статьи и готовлю их к публикации'},
 lab:{title:'Скоро появится',description:'Дополнительные материалы скоро станут доступны'},
};

export function NavigationTooltip({section,children}){
 return <Tooltip content={content[section]}>{children}</Tooltip>;
}
