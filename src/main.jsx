import React, {useEffect, useRef, useState} from 'react';
import { createRoot } from 'react-dom/client';
import { Menu, SlidersHorizontal, MapPin, Info, RotateCcw, X, Heart, MessageCircle, Gift, UserRound, Flower2, Droplets, Sun, Sparkles, ChevronDown } from 'lucide-react';
import './styles.css';

const flowers = [
  {name:'Blue Rose', origin:'Ecuador', tagline:'Mysterious and unique.', quote:'I stand for the impossible.', image:'/assets/blue-rose.png', tone:'#89badd', tags:['Elegant','Mysterious','One of a kind'], match:98},
  {name:'Blush Peony', origin:'France', tagline:'Soft, joyful and timeless.', quote:'I bloom at my own pace.', image:'/assets/blush-peony.png', tone:'#f59aae', tags:['Romantic','Warm','Dreamy'], match:94},
  {name:'Moon Orchid', origin:'Thailand', tagline:'Quietly extraordinary.', quote:'Beauty lives in the details.', image:'/assets/moon-orchid.png', tone:'#b99adf', tags:['Rare','Calm','Graceful'], match:91}
];

function IconButton({children, label, className='', onClick}) { return <button aria-label={label} className={`icon-btn ${className}`} onClick={onClick}>{children}</button> }

function App(){
 const [index,setIndex]=useState(0), [liked,setLiked]=useState(false), [notice,setNotice]=useState(''), [animating,setAnimating]=useState(false);
 const [activeTab,setActiveTab]=useState('discover');
 const [drag,setDrag]=useState({x:0,start:null}); const pointer=useRef(null); const flower=flowers[index%flowers.length];
 const upcoming=flowers[(index+1)%flowers.length]; const reveal=Math.min(Math.abs(drag.x)/210,1);
 useEffect(()=>{flowers.forEach(item=>{const image=new Image();image.src=item.image})},[]);
 const next=(kind='skip')=>{
  if(animating)return;
  const direction=kind==='like'?1:-1;
  setAnimating(true);setNotice('');setLiked(false);
  setDrag({x:direction*560,start:null});
  setTimeout(()=>{
   setIndex(v=>v+1);setDrag({x:0,start:null});setAnimating(false);setLiked(false);setNotice('');
  },340);
 };
 useEffect(()=>{
  const handleKey=e=>{
   if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
   if(e.key==='ArrowLeft'){e.preventDefault();next('skip')}
   if(e.key==='ArrowRight'){e.preventDefault();next('like')}
  };
  window.addEventListener('keydown',handleKey);
  return()=>window.removeEventListener('keydown',handleKey);
 },[animating]);
 const down=e=>{if(animating)return;pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);setDrag({x:0,start:e.clientX})};
 const move=e=>{if(drag.start!==null)setDrag(d=>({...d,x:e.clientX-d.start}))};
 const up=()=>{if(drag.start===null)return;if(Math.abs(drag.x)>75)next(drag.x>0?'like':'skip');else setDrag({x:0,start:null});pointer.current=null};
 return <main className="shell">
   <div className="ambient a1"/><div className="ambient a2"/>
   <header>
    <IconButton label="Open menu"><Menu/></IconButton>
    <div className="brand"><img className="brand-logo" src="/assets/elegant-florist-logo.png" alt="Elégant Florist" /></div>
    <IconButton label="Filters"><SlidersHorizontal/></IconButton>
   </header>
   <section className="main-stage">
    <section className="deck">
    <div className="back-card one"/><div className="back-card two"/>
    <div key={`preview-${index}`} className="preview-card" aria-hidden="true" style={{transform:`translateY(${8-reveal*8}px) scale(${.96+reveal*.04})`}}>
      <img src={upcoming.image} alt=""/><div className="veil"/>
      <div className="badge"><span>✿</span><b>{upcoming.name}</b><small>Rare & Elegant</small></div>
      <div className="info"><Info size={20}/></div>
      <aside><div><Flower2/><span>Rare</span></div><div><Sun/><span>Loves Sun</span></div><div><Droplets/><span>Medium<br/>Water</span></div></aside>
      <div className="card-copy"><h1>{upcoming.name}<Sparkles/></h1><p className="origin"><MapPin/> {upcoming.origin}</p><p>{upcoming.tagline}<br/>{upcoming.quote}</p><div className="tags">{upcoming.tags.map(t=><span key={t}>{t}</span>)}</div></div>
      <div className="score"><Flower2/><b>{upcoming.match}%</b><span>Match</span></div>
    </div>
    <article key={index} className="card" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      style={{transform:`translateX(${drag.x}px) rotate(${drag.x/30}deg)`,opacity:Math.abs(drag.x)>360?.1:1,transition:drag.start===null&&animating?'transform .33s cubic-bezier(.2,.72,.2,1), opacity .27s ease':drag.start===null?'transform .36s cubic-bezier(.2,.72,.2,1)':'none'}}>
      <img src={flower.image} alt={flower.name}/><div className="veil"/>
      {Math.abs(drag.x)>35&&<div className={`stamp ${drag.x>0?'yes':'no'}`}>{drag.x>0?'BLOOM':'PASS'}</div>}
      <div className="badge"><span>✿</span><b>{flower.name}</b><small>Rare & Elegant</small></div>
      <button className="info"><Info size={20}/></button>
      <aside><div><Flower2/><span>Rare</span></div><div><Sun/><span>Loves Sun</span></div><div><Droplets/><span>Medium<br/>Water</span></div></aside>
      <div className="card-copy"><h1>{flower.name}<Sparkles/></h1><p className="origin"><MapPin/> {flower.origin}</p><p>{flower.tagline}<br/>{flower.quote}</p><div className="tags">{flower.tags.map(t=><span key={t}>{t}</span>)}</div></div>
      <div className="score"><Flower2/><b>{flower.match}%</b><span>Match</span></div>
    </article>
    </section>
    <div className="hint">Swipe to discover<br/>your perfect bloom <span>↝</span></div>
   </section>
   <footer className="bottom-zone">
    <section className="actions">
    <IconButton label="Undo" onClick={()=>setIndex(v=>Math.max(0,v-1))}><RotateCcw/></IconButton>
    <IconButton label="Pass" onClick={()=>next('skip')}><X/></IconButton>
    <IconButton label="Bloom" className={`primary ${liked?'liked':''}`} onClick={()=>next('like')}><Flower2 fill="white"/></IconButton>
    <IconButton label="Like" onClick={()=>next('like')}><Heart fill="currentColor"/></IconButton>
    <IconButton label="Message"><MessageCircle fill="currentColor"/></IconButton>
    </section>
    <nav className="ios-glass-nav">
    <span className="glass-shine" aria-hidden="true" />
    <button className={activeTab==='discover'?'active':''} onClick={()=>setActiveTab('discover')}><span className="nav-icon"><Flower2 fill="currentColor"/></span><span>Discover</span></button>
    <button className={activeTab==='garden'?'active':''} onClick={()=>setActiveTab('garden')}><span className="nav-icon"><Gift/></span><span>Garden</span></button>
    <button className={activeTab==='matches'?'active':''} onClick={()=>setActiveTab('matches')}><span className="nav-icon"><Heart/></span><i>12</i><span>Matches</span></button>
    <button className={activeTab==='messages'?'active':''} onClick={()=>setActiveTab('messages')}><span className="nav-icon"><MessageCircle/></span><i>3</i><span>Messages</span></button>
    <button className={activeTab==='profile'?'active':''} onClick={()=>setActiveTab('profile')}><span className="nav-icon"><UserRound/></span><span>Profile</span></button>
    </nav>
   </footer>
   {notice&&<div className="toast">{notice}</div>}
 </main>
}
createRoot(document.getElementById('root')).render(<App/>);
