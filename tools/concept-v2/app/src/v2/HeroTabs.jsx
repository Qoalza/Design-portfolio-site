import './hero-tabs.css';

function HeroTabIcon({name}) {
  const shared={fill:'none',stroke:'currentColor',strokeWidth:1.3};

  return (
    <span className="v2-hero-tab-icon" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {name==='scenario-media' ? <path d="M9 7H4.6C4.04 7 3.76 7 3.546 7.109C3.358 7.205 3.205 7.358 3.109 7.546C3 7.76 3 8.04 3 8.6V19.4C3 19.96 3 20.24 3.109 20.454C3.205 20.642 3.358 20.795 3.546 20.891C3.76 21 4.04 21 4.6 21H9M9 21H15M9 21V4.6C9 4.04 9 3.76 9.109 3.546C9.205 3.358 9.358 3.205 9.546 3.109C9.76 3 10.04 3 10.6 3H13.4C13.96 3 14.24 3 14.454 3.109C14.642 3.205 14.795 3.358 14.891 3.546C15 3.76 15 4.04 15 4.6V21M15 11H19.4C19.96 11 20.24 11 20.454 11.109C20.642 11.205 20.795 11.358 20.891 11.546C21 11.76 21 12.04 21 12.6V19.4C21 19.96 21 20.24 20.891 20.454C20.795 20.642 20.642 20.795 20.454 20.891C20.24 21 19.96 21 19.4 21H15" {...shared} strokeLinejoin="round"/> : null}
        {name==='scenario-statistics' ? <>
          <path d="M17.2 13.982C17.477 13.982 17.616 13.982 17.728 14.044C17.82 14.094 17.907 14.19 17.948 14.287C17.998 14.405 17.985 14.53 17.96 14.781A8 8 0 1 1 9.201 6.022C9.452 5.997 9.577 5.984 9.695 6.034C9.792 6.076 9.888 6.162 9.939 6.254C10 6.367 10 6.505 10 6.782V13.182C10 13.462 10 13.602 10.055 13.709C10.102 13.803 10.179 13.88 10.273 13.928C10.38 13.982 10.52 13.982 10.8 13.982H17.2Z" {...shared} strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2.782C14 2.505 14 2.367 14.062 2.254C14.112 2.162 14.208 2.076 14.305 2.034C14.423 1.984 14.548 1.997 14.799 2.022A8 8 0 0 1 21.96 9.183C21.985 9.434 21.998 9.56 21.948 9.677C21.907 9.775 21.82 9.87 21.728 9.921C21.616 9.982 21.477 9.982 21.2 9.982H14.8C14.52 9.982 14.38 9.982 14.273 9.928C14.179 9.88 14.102 9.803 14.055 9.709C14 9.602 14 9.462 14 9.182V2.782Z" {...shared} strokeLinecap="round" strokeLinejoin="round"/>
        </> : null}
        {name==='scenario-space' ? <path d="M3 16V7.2C3 6.08 3 5.52 3.218 5.092C3.41 4.716 3.716 4.41 4.092 4.218C4.52 4 5.08 4 6.2 4H17.8C18.92 4 19.48 4 19.908 4.218C20.284 4.41 20.59 4.716 20.782 5.092C21 5.52 21 6.08 21 7.2V16H15.663C15.418 16 15.296 16 15.181 16.028C15.079 16.052 14.981 16.093 14.892 16.147C14.791 16.209 14.704 16.296 14.531 16.469L14.469 16.531C14.296 16.704 14.209 16.791 14.108 16.853C14.019 16.907 13.921 16.948 13.819 16.972C13.704 17 13.582 17 13.337 17H10.663C10.418 17 10.296 17 10.181 16.972C10.079 16.948 9.981 16.907 9.892 16.853C9.791 16.791 9.704 16.704 9.531 16.531L9.469 16.469C9.296 16.296 9.209 16.209 9.108 16.147C9.019 16.093 8.921 16.052 8.819 16.028C8.704 16 8.582 16 8.337 16H3ZM3 16C2.448 16 2 16.448 2 17V17.333C2 17.953 2 18.263 2.068 18.518C2.253 19.208 2.792 19.747 3.482 19.932C3.737 20 4.047 20 4.667 20H19.333C19.953 20 20.263 20 20.518 19.932C21.208 19.747 21.747 19.208 21.932 18.518C22 18.263 22 17.953 22 17.333C22 17.023 22 16.868 21.966 16.741C21.874 16.396 21.604 16.127 21.259 16.034C21.132 16 20.977 16 20.667 16H20" {...shared} strokeLinecap="round" strokeLinejoin="round"/> : null}
        {name==='scenario-auth' ? <path fillRule="evenodd" clipRule="evenodd" d="M4.65 4.65a5.567 5.567 0 0 1 9.118 5.969l1.509 1.509v1.574h1.574v1.575h1.575v1.574H20V20h-3.149l-6.232-6.232A5.567 5.567 0 1 1 4.65 4.65Zm1.968 1.968a1.67 1.67 0 1 0 2.361 2.361 1.67 1.67 0 0 0-2.361-2.361Z" {...shared}/> : null}
        {name==='size-min' ? <>
          <path d="M14 9a1 1 0 0 0 1 1h7v7h-4a1 1 0 0 0-1 1v4h-7v-7a1 1 0 0 0-1-1H2V7h4a1 1 0 0 0 1-1V2h7v7Z" fill="currentColor" fillOpacity=".2"/>
          <path d="M2 14h7a1 1 0 0 1 1 1v7M22 10h-7a1 1 0 0 1-1-1V2M9.707 14.293 2 22M14.293 9.707l7.5-7.5M22 17h-4a1 1 0 0 0-1 1v4M2 7h4a1 1 0 0 0 1-1V2" {...shared}/>
        </> : null}
        {name==='size-mobile' ? <path d="M18 3.538h-.65v16.924H18h.65V3.538H18Zm0 16.924h-.65c0 .506-.396.888-.85.888V22v.65c1.203 0 2.15-.995 2.15-2.188H18ZM16.5 22v-.65h-9V22v.65h9V22Zm-9 0v-.65c-.454 0-.85-.382-.85-.888H6h-.65c0 1.193.947 2.188 2.15 2.188V22ZM6 20.462h.65V3.538H6h-.65v16.924H6ZM6 3.538h.65c0-.506.396-.888.85-.888V2v-.65c-1.203 0-2.15.995-2.15 2.188H6ZM7.5 2v.65h9V2v-.65h-9V2Zm9 0v.65c.454 0 .85.382.85.888H18h.65c0-1.193-.947-2.188-2.15-2.188V2Zm-3.75 3.462h-.65c0 .081-.06.119-.1.119v.65h.75c.789 0 1.4-.651 1.4-1.419h-1.3c0 .425-.336.77-.75.77-.414 0-.75-.345-.75-.77h-1.3c0 .768.611 1.419 1.4 1.419h.75v-.65c-.04 0-.1-.038-.1-.119h-.65c0-.768.611-1.419 1.4-1.419s1.4.651 1.4 1.419h-1.3Z" fill="currentColor"/> : null}
        {name==='size-tablet' ? <>
          <path d="M20 20.333V3.667C20 2.746 19.284 2 18.4 2H5.6C4.716 2 4 2.746 4 3.667v16.666C4 21.254 4.716 22 5.6 22h12.8c.884 0 1.6-.746 1.6-1.667Z" fill="currentColor" fillOpacity=".2"/>
          <path d="M9 5h6m5-1.333v16.666C20 21.254 19.284 22 18.4 22H5.6C4.716 22 4 21.254 4 20.333V3.667C4 2.746 4.716 2 5.6 2h12.8c.884 0 1.6.746 1.6 1.667Z" {...shared} strokeLinecap="round" strokeLinejoin="round"/>
        </> : null}
        {name==='size-desktop' ? <>
          <path d="M3.667 18h16.666C21.254 18 22 17.254 22 16.333V4.667C22 3.746 21.254 3 20.333 3H3.667C2.746 3 2 3.746 2 4.667v11.666C2 17.254 2.746 18 3.667 18Z" fill="currentColor" fillOpacity=".2"/>
          <path d="M15 21H9m11.333-3H3.667C2.746 18 2 17.254 2 16.333V4.667C2 3.746 2.746 3 3.667 3h16.666C21.254 3 22 3.746 22 4.667v11.666C22 17.254 21.254 18 20.333 18Z" {...shared} strokeLinecap="round" strokeLinejoin="round"/>
        </> : null}
        {name==='size-max' ? <>
          <path d="M2 15v6.231c0 .425.344.769.769.769H9m13-5v4.231a.769.769 0 0 1-.769.769H17M2 7V2.769C2 2.344 2.344 2 2.769 2H7m15 7V2.769A.769.769 0 0 0 21.231 2H15M22 2 2 22" {...shared}/>
          <path d="M3.778 22H22V3.6c0-.56 0-.84-.109-1.054a1 1 0 0 0-.437-.437C21.24 2 20.96 2 20.4 2H2v18.222c0 .623 0 .934.121 1.171a1.11 1.11 0 0 0 .486.486C2.844 22 3.156 22 3.778 22Z" fill="currentColor" fillOpacity=".2"/>
        </> : null}
      </svg>
    </span>
  );
}

export function ScenarioTab({icon,label,active=false,disabled=false,interactive=true,className='',...props}) {
  const classes=`v2-scenario-tab${active?' is-active':''}${className?` ${className}`:''}`;
  const content=<><span className="v2-scenario-tab-content"><HeroTabIcon name={icon}/><span>{label}</span></span><span className="v2-scenario-tab-line" aria-hidden="true"/></>;

  if (!interactive) {
    return <div className={classes} aria-current={active?'true':undefined}>{content}</div>;
  }

  return <button type="button" className={classes} disabled={disabled} aria-pressed={active} {...props}>{content}</button>;
}

export function AdaptiveSizeTab({icon,caption,value,active=false,disabled=false,className='',...props}) {
  return (
    <button type="button" className={`v2-size-tab${active?' is-active':''}${className?` ${className}`:''}`} disabled={disabled} aria-pressed={active} {...props}>
      <span className="v2-size-tab-copy">
        <span className="v2-size-tab-caption">{caption}</span>
        <span className="v2-size-tab-value">{value}</span>
      </span>
      <span className="v2-size-tab-icon-box"><HeroTabIcon name={icon}/></span>
    </button>
  );
}
