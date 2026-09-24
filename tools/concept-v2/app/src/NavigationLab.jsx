import {useEffect,useRef,useState} from 'react';
import {Preloader,INITIAL_MESSAGES,RETRY_MESSAGES} from './Preloader';
import {createPreloaderGate} from './preloader-gate.mjs';
import {LAB_PRESETS,resolveLabAttempt} from './navigation-lab-scenario.mjs';
import './navigation-lab.css';

const initial={visible:false,mode:'normal',reason:null,retryNumber:0,showReadyMessage:false,leaving:false};

function delay(ms,signal){
  return new Promise((resolve,reject)=>{
    if(signal.aborted){reject(signal.reason);return;}
    const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);
    const abort=()=>{clearTimeout(timer);reject(signal.reason);};
    signal.addEventListener('abort',abort,{once:true});
  });
}

function pendingUntilAbort(signal){
  return new Promise((_,reject)=>{
    if(signal.aborted){reject(signal.reason);return;}
    signal.addEventListener('abort',()=>reject(signal.reason),{once:true});
  });
}

export function NavigationLab(){
  const gate=useRef(null);
  const [page,setPage]=useState('home');
  const [preset,setPreset]=useState('cycle');
  const [busy,setBusy]=useState(false);
  const [veil,setVeil]=useState('');
  const [state,setState]=useState(initial);
  useEffect(()=>{
    const session=createPreloaderGate({onState:setState});
    gate.current=session;
    return()=>{session.dispose();if(gate.current===session)gate.current=null;};
  },[]);
  const navigate=next=>{
    if(next===page||busy)return;
    setBusy(true);
    let attemptIndex=0;
    gate.current?.start({
      prepare:async signal=>{
        const response=await fetch('/navigation-lab-page.json',{signal,cache:'no-store'});
        if(!response.ok)throw new TypeError('Не удалось получить тестовую страницу');
        const data=await response.json();
        if(!data.pages.includes(next))throw new TypeError('Тестовая страница не найдена');
        const attempt=resolveLabAttempt(preset,attemptIndex++);
        if(attempt.kind==='pending')await pendingUntilAbort(signal);
        else await delay(attempt.delay,signal);
        if(attempt.kind==='connection')throw new TypeError('Смоделирован обрыв соединения');
        return next;
      },
      commit:value=>{setPage(value);setBusy(false);},
      softTransition:async value=>{
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setPage(value);setBusy(false);return;}
        setVeil('closing');
        await delay(180,new AbortController().signal);
        setPage(value);
        setVeil('opening');
        await delay(180,new AbortController().signal);
        setVeil('');
        setBusy(false);
      },
    });
  };
  const captions=state.reason
    ?RETRY_MESSAGES[state.reason][Math.min(state.retryNumber,2)-1]
    :INITIAL_MESSAGES;
  return <div className="navigation-lab">
    <div className="navigation-lab-page" inert={state.visible} aria-hidden={state.visible}>
      <header className="navigation-lab-header"><span>Артур · Concept V2</span><nav aria-label="Тестовые страницы">
        <button type="button" onClick={()=>navigate('home')} aria-current={page==='home'?'page':undefined} disabled={busy&&page==='home'}>Главная</button>
        <button type="button" onClick={()=>navigate('projects')} aria-current={page==='projects'?'page':undefined} disabled={busy&&page==='projects'}>Проекты</button>
      </nav></header>
      <main className="navigation-lab-main" aria-busy={busy}>
        <p className="navigation-lab-eyebrow">ЛОКАЛЬНАЯ ПРОВЕРКА ПЕРЕХОДОВ</p>
        {page==='home'?<><h1>Главная страница</h1><p>В режиме «Цикл» нажмите «Проекты»: после долгой загрузки повторите попытку, чтобы увидеть обрыв соединения, а затем снова долгую загрузку.</p></>
          :<><h1>Страница проектов</h1><p>Вернитесь на главную. Длительность и исход загрузки можно менять перед каждым переходом.</p></>}
        <div className="navigation-lab-card" aria-hidden="true"><span>{page==='home'?'01':'02'}</span><i/><i/><i/></div>
      </main>
      <div className="navigation-lab-controls"><label htmlFor="lab-speed">Условие загрузки</label><select id="lab-speed" value={preset} onChange={event=>setPreset(event.target.value)}>{Object.entries(LAB_PRESETS).map(([key,item])=><option key={key} value={key}>{item.label}</option>)}</select><span>{busy?'Подготавливаю страницу…':'Нажмите на другую страницу вверху'}</span></div>
    </div>
    <div className={`navigation-lab-veil ${veil}`} aria-hidden="true"/>
    {state.visible&&<Preloader state={state.mode} captionSet={captions} onRetry={()=>gate.current?.retry()} showReadyMessage={state.showReadyMessage} overlay leaving={state.leaving}/>}
  </div>;
}
