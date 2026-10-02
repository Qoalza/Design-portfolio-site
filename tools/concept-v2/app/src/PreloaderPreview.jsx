import {useState} from 'react';
import {Preloader, RETRY_MESSAGES} from './Preloader';
import './preloader-preview.css';

const states=[
  {id:'normal',label:'Загрузка'},
  {id:'slow',label:'Долгая загрузка'},
  {id:'connection',label:'Нет соединения'},
];

export function PreloaderPreview(){
  const [mode,setMode]=useState('normal');
  const [captionSet,setCaptionSet]=useState();
  const [retryCounts,setRetryCounts]=useState({slow:0,connection:0});
  const [retryCopy,setRetryCopy]=useState();
  const selectState=nextMode=>{
    setMode(nextMode);
    setCaptionSet(undefined);
    setRetryCopy(undefined);
  };
  const handleRetry=reason=>{
    const retryNumber=retryCounts[reason];
    setRetryCounts({...retryCounts,[reason]:retryNumber+1});
    setCaptionSet(RETRY_MESSAGES[reason][Math.min(retryNumber,1)]);
    setRetryCopy({reason,number:Math.min(retryNumber+1,2)});
    setMode('normal');
  };
  return <div className="preloader-preview">
    <Preloader state={mode} captionSet={captionSet} onRetry={handleRetry}/>
    <nav className="preloader-preview-controls" aria-label="Состояние прелоадера">
      <span>{retryCopy?`Повтор ${retryCopy.number}: ${retryCopy.reason==='slow'?'долгая загрузка':'нет соединения'}`:'Состояние'}</span>
      <div className="preloader-preview-options">
        {states.map(state=><button key={state.id} type="button" aria-pressed={mode===state.id} onClick={()=>selectState(state.id)}>{state.label}</button>)}
      </div>
    </nav>
  </div>;
}
