import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';
class Boundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div style={{padding:60,fontFamily:'sans-serif'}}><h1>画布暂时无法显示</h1><p>重新打开应用后，可以从自动恢复副本继续。</p><button onClick={()=>location.reload()}>重新打开</button></div>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<Boundary><App/></Boundary>);
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{});});
}
