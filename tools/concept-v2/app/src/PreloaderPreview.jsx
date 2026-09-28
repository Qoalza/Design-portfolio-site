import {useState} from 'react';
import {Preloader} from './Preloader';
import './preloader-preview.css';

const states=[
  {id:'normal',label:'Загрузка'},
  {id:'slow',label:'Долгая загрузка'},
  {id:'connection',label:'Нет соединения'},
];

export function PreloaderPreview(){
  const [mode,setMode]=useState('normal');
  return <div className="preloader-preview">
    <Preloader state={mode} onRetry={()=>setMode('normal')}/>
    <nav className="preloader-preview-controls" aria-label="Состояние прелоадера">
      <span>Состояние</span>
      <div className="preloader-preview-options">
        {states.map(state=><button key={state.id} type="button" aria-pressed={mode===state.id} onClick={()=>setMode(state.id)}>{state.label}</button>)}
      </div>
    </nav>
  </div>;
}
