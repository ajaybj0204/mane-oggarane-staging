'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {bearerFetch} from '../lib/supabase';
import {useApp} from './AppProvider';
import {rupees} from '../lib/types';
import type {AssistantReply} from '../lib/assistant';

type Msg={id:number;from:'bot'|'me';text:string;data?:AssistantReply};
const GREETING="Namaskara! 🙏 Welcome to Mane & Oggarane. I'm your kitchen assistant. Ask me about our menu, delivery, ordering or rewards. How can I help you today?";
const QUICK=['Explore our menu','Check delivery PIN code','Delivery charges','Track my order','How rewards work'];
let seq=1;

/** Floating kitchen assistant. Conversation lives only in memory (not stored anywhere). */
export default function KitchenAssistant(){
  const pathname=usePathname();const {add,cart}=useApp();
  const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [input,setInput]=useState('');
  const [msgs,setMsgs]=useState<Msg[]>([{id:0,from:'bot',text:GREETING,data:{reply:GREETING,suggestions:QUICK}}]);
  const listRef=useRef<HTMLDivElement>(null);const inputRef=useRef<HTMLInputElement>(null);const fabRef=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(open)setTimeout(()=>inputRef.current?.focus(),60)},[open]);
  useEffect(()=>{listRef.current?.scrollTo({top:listRef.current.scrollHeight,behavior:'smooth'})},[msgs,busy]);
  useEffect(()=>{if(!open)return;const k=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);fabRef.current?.focus()}};document.addEventListener('keydown',k);return()=>document.removeEventListener('keydown',k)},[open]);
  if(pathname?.startsWith('/owner'))return null; // keep staff screens uncluttered

  async function send(textIn:string){
    const text=textIn.trim().slice(0,500);if(!text||busy)return;
    setInput('');setMsgs(m=>[...m,{id:seq++,from:'me',text}]);setBusy(true);
    try{
      const r=await bearerFetch('/api/assistant',{method:'POST',body:JSON.stringify({message:text})});
      const d=await r.json();
      const data:AssistantReply=r.ok?d:{reply:d.error||'Sorry, something went wrong. Please try again.'};
      setMsgs(m=>[...m,{id:seq++,from:'bot',text:data.reply,data}]);
    }catch{setMsgs(m=>[...m,{id:seq++,from:'bot',text:'I could not connect just now. Please check your internet and try again.'}])}
    finally{setBusy(false)}
  }
  const inCart=(id:string)=>cart.find(c=>c.id===id)?.quantity||0;
  const last=msgs[msgs.length-1];

  return <>
    <button ref={fabRef} type="button" className={'mo-chat-fab '+(open?'is-hidden':'')} onClick={()=>setOpen(true)} aria-label="Open kitchen assistant chat" aria-expanded={open} aria-controls="mo-chat-panel">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.4c-.5.4-1.3 0-1.3-.6V16H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" fill="currentColor"/><circle cx="9" cy="9.6" r="1.2" fill="#2a1a10"/><circle cx="12" cy="9.6" r="1.2" fill="#2a1a10"/><circle cx="15" cy="9.6" r="1.2" fill="#2a1a10"/></svg>
      <span>Ask us</span>
    </button>
    {open&&<section id="mo-chat-panel" className="mo-chat" role="dialog" aria-modal="false" aria-labelledby="mo-chat-title">
      <header className="mo-chat-head">
        <span className="mo-brand-seal"><img src="/theme/logo-128.webp" alt="" width={40} height={40}/></span>
        <div><h2 id="mo-chat-title">Kitchen assistant</h2><p><span className="mo-chat-dot" aria-hidden="true"/> Mane &amp; Oggarane · instant answers</p></div>
        <button type="button" className="mo-chat-close" onClick={()=>{setOpen(false);fabRef.current?.focus()}} aria-label="Close chat">×</button>
      </header>
      <div className="mo-chat-log" ref={listRef} aria-live="polite" aria-relevant="additions">
        {msgs.map(m=><div key={m.id} className={'mo-chat-msg '+(m.from==='me'?'is-me':'is-bot')}>
          <p>{m.text}</p>
          {m.data?.dishes?.length?<ul className="mo-chat-dishes">{m.data.dishes.map(d=><li key={d.id}>
            <span className={'mo-diet-dot mo-diet-'+(d.veg?'veg':'nonveg')} aria-label={d.veg?'Vegetarian':'Non-vegetarian'}/>
            <span className="mo-chat-dish-name">{d.name}</span><b>{rupees(d.price)}</b>
            <button type="button" onClick={()=>add(d.id)} aria-label={'Add '+d.name+' to basket'}>{inCart(d.id)?`+1 (${inCart(d.id)})`:'+ Add'}</button>
          </li>)}</ul>:null}
          {m.data?.links?.length?<div className="mo-chat-links">{m.data.links.map(l=>l.href.startsWith('http')?<a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>:<Link key={l.href} href={l.href} onClick={()=>{if(window.matchMedia('(max-width: 640px)').matches)setOpen(false)}}>{l.label} →</Link>)}</div>:null}
        </div>)}
        {busy&&<div className="mo-chat-msg is-bot mo-chat-typing" aria-label="Assistant is typing"><i/><i/><i/></div>}
      </div>
      {last?.from==='bot'&&last.data?.suggestions?.length&&!busy?<div className="mo-chat-suggest">{last.data.suggestions.map(s=><button type="button" key={s} onClick={()=>void send(s)}>{s}</button>)}</div>:null}
      <form className="mo-chat-form" onSubmit={e=>{e.preventDefault();void send(input)}}>
        <label className="sr-only" htmlFor="mo-chat-input">Type your question</label>
        <input id="mo-chat-input" ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} maxLength={500} placeholder="Ask about dishes, delivery, rewards…" autoComplete="off"/>
        <button type="submit" disabled={!input.trim()||busy} aria-label="Send message"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 12 20 4l-6 16-2.5-6.5L4 12Z" fill="currentColor"/></svg></button>
      </form>
      <p className="mo-chat-note">Never share passwords, OTPs or card details in chat.</p>
    </section>}
  </>;
}
