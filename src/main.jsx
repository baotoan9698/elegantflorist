import React, {useEffect, useRef, useState} from 'react';
import { createRoot } from 'react-dom/client';
import { Menu, SlidersHorizontal, MapPin, Info, RotateCcw, X, Heart, MessageCircle, Gift, UserRound, Flower2, Droplets, Sun, Sparkles, Search, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import './styles.css';
import Admin from './Admin';
import {supabase, productView} from './supabase';
import {getProductCategories} from './productCategories';

import {flowers, gardenProducts} from './sampleCatalog';

const gardenCategories = ['Tất cả','Hoa Hồng','Hoa Mix','Hoa Lan','Hoa Cưới','Hoa Chúc Mừng'];
const flowerSlug=name=>name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const allFlowerEntries=[...flowers,...gardenProducts];
const flowerDetail=item=>{
 const source=flowers.find(flower=>flower.image===item.image)||flowers[0];
 return {...source,...item,tags:item.tags||source.tags,origin:item.origin||source.origin,tagline:item.tagline||source.tagline,quote:item.quote||source.quote};
};
const flowerFromPath=()=>{
 const slug=window.location.pathname.match(/^\/flowers\/([^/]+)\/?$/)?.[1];
 return slug?allFlowerEntries.find(item=>flowerSlug(item.name)===slug)||null:null;
};

function IconButton({children, label, className='', onClick}) { return <button aria-label={label} className={`icon-btn ${className}`} onClick={onClick}>{children}</button> }

function Garden({onOpenProduct,items=gardenProducts}){
 const [category,setCategory]=useState('Tất cả');
 const filterDrag=useRef(null),filterMoved=useRef(false);
 const startFilterDrag=e=>{if(e.pointerType!=='mouse'||e.button!==0)return;filterMoved.current=false;filterDrag.current={x:e.clientX,left:e.currentTarget.scrollLeft}};
 const moveFilterDrag=e=>{const start=filterDrag.current;if(!start)return;const distance=e.clientX-start.x;if(Math.abs(distance)>5){filterMoved.current=true;e.currentTarget.setPointerCapture(e.pointerId)}if(filterMoved.current)e.currentTarget.scrollLeft=start.left-distance};
 const products=category==='Tất cả'?items:items.filter(item=>getProductCategories(item).includes(category));
 const gardenCategories=['Tất cả',...new Set(items.flatMap(getProductCategories))];
 return <section className="garden-view">
   <div className="garden-heading">
    <div><span>Our collection</span><h1>Garden</h1></div>
    <button className="garden-search" aria-label="Tìm kiếm"><Search/></button>
   </div>
   <div className="garden-filters" aria-label="Danh mục hoa" tabIndex={0} onPointerDown={startFilterDrag} onPointerMove={moveFilterDrag} onPointerUp={()=>{filterDrag.current=null}} onPointerCancel={()=>{filterDrag.current=null}} onClickCapture={e=>{if(filterMoved.current){e.preventDefault();e.stopPropagation();filterMoved.current=false}}}>
    {gardenCategories.map(item=><button key={item} className={category===item?'active':''} onClick={()=>setCategory(item)}>{item}</button>)}
   </div>
   <div className="product-grid">
    {products.map((item,i)=><article className="product-tile" key={`${item.name}-${i}`} onClick={()=>onOpenProduct(item)} tabIndex="0" onKeyDown={e=>{if(e.key==='Enter')onOpenProduct(item)}}>
      <img src={item.image} alt={item.name} style={{objectPosition:item.position}} loading="eager" />
      <div className="product-gradient" />
      <button className="product-like" aria-label={`Yêu thích ${item.name}`}><Heart/></button>
      <div className="product-meta"><span title={getProductCategories(item).join(' · ')}>{getProductCategories(item).join(' · ')}</span><h2>{item.name}</h2><p>{item.price}</p></div>
      <button className="product-cart" aria-label={`Thêm ${item.name} vào giỏ`}><ShoppingBag/></button>
    </article>)}
   </div>
  </section>
}

const sampleFlowers=flowers;
function App({catalog=null}){
 const flowers=catalog?(catalog.some(item=>item.featured)?catalog.filter(item=>item.featured):catalog):sampleFlowers;
 const flowerFromPath=()=>{
  const slug=window.location.pathname.match(/^\/flowers\/([^/]+)\/?$/)?.[1];
  return (catalog||allFlowerEntries).find(item=>(item.slug||flowerSlug(item.name))===slug)||null;
 };
 const [index,setIndex]=useState(0), [liked,setLiked]=useState(false), [notice,setNotice]=useState(''), [animating,setAnimating]=useState(false);
 const [activeTab,setActiveTab]=useState('discover');
 const [detailItem,setDetailItem]=useState(()=>flowerFromPath()), [detailPhoto,setDetailPhoto]=useState(0), [detailDrag,setDetailDrag]=useState({x:0,start:null});
 const [drag,setDrag]=useState({x:0,start:null}); const pointer=useRef(null), didDrag=useRef(false); const flower=flowers[index%flowers.length];
 const upcoming=flowers[(index+1)%flowers.length]; const reveal=Math.min(Math.abs(drag.x)/210,1);
 const detailFlower=detailItem?(catalog?detailItem:flowerDetail(detailItem)):null;
 const detailGallery=detailFlower?(detailFlower.images?.length?detailFlower.images:[detailFlower.image]):[];
 const changeDetailPhoto=direction=>setDetailPhoto(current=>(current+direction+detailGallery.length)%detailGallery.length);
 const detailUp=()=>{if(detailDrag.start===null)return;if(Math.abs(detailDrag.x)>45)changeDetailPhoto(detailDrag.x<0?1:-1);setDetailDrag({x:0,start:null})};
 const openDetail=item=>{setDetailItem(item);setDetailPhoto(0);setDetailDrag({x:0,start:null});window.history.pushState({},'',`/flowers/${item.slug||flowerSlug(item.name)}`)};
 const closeDetail=()=>{setDetailItem(null);setDetailPhoto(0);window.history.pushState({},'','/')};
 useEffect(()=>{const onPopState=()=>{setDetailItem(flowerFromPath());setDetailPhoto(0)};window.addEventListener('popstate',onPopState);return()=>window.removeEventListener('popstate',onPopState)},[catalog]);
 useEffect(()=>{flowers.forEach(item=>{const image=new Image();image.src=item.image})},[]);
 const next=(kind='skip')=>{
  if(animating)return;
  const direction=kind==='like'?1:-1;
  setAnimating(true);setNotice('');setLiked(false);
  setDrag({x:direction*560,start:null});
 setTimeout(()=>{
   setIndex(v=>v+1);setDrag({x:0,start:null});setAnimating(false);setLiked(false);setNotice('');
  },750);
 };
 useEffect(()=>{
  const handleKey=e=>{
   if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
   if(detailItem){
    if(e.key==='Escape'){e.preventDefault();closeDetail()}
    if(e.key==='ArrowLeft'){e.preventDefault();changeDetailPhoto(-1)}
    if(e.key==='ArrowRight'){e.preventDefault();changeDetailPhoto(1)}
    return;
   }
   if(e.key==='ArrowLeft'){e.preventDefault();next('skip')}
   if(e.key==='ArrowRight'){e.preventDefault();next('like')}
  };
  window.addEventListener('keydown',handleKey);
  return()=>window.removeEventListener('keydown',handleKey);
 },[animating,detailItem,detailPhoto]);
 const down=e=>{if(animating)return;didDrag.current=false;pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);setDrag({x:0,start:e.clientX})};
 const move=e=>{if(drag.start!==null){if(Math.abs(e.clientX-drag.start)>8)didDrag.current=true;setDrag(d=>({...d,x:e.clientX-d.start}))}};
 const up=()=>{if(drag.start===null)return;if(Math.abs(drag.x)>75)next(drag.x>0?'like':'skip');else setDrag({x:0,start:null});pointer.current=null};
 return <main className="shell">
   <div className="ambient a1"/><div className="ambient a2"/>
   <header>
    <IconButton label="Open menu"><Menu/></IconButton>
    <div className="brand"><img className="brand-logo" src="/assets/elegant-florist-logo.png" alt="Elégant Florist" /></div>
    <IconButton label="Filters"><SlidersHorizontal/></IconButton>
   </header>
   <section className={`main-stage ${activeTab==='garden'?'garden-stage':''}`}>
   {activeTab==='garden'?<Garden onOpenProduct={openDetail} items={catalog||gardenProducts}/>:<>
    <section className="deck">
    <div className="back-card one"/><div className="back-card two"/>
    <div key={`preview-${index}`} className="preview-card" aria-hidden="true" style={{transform:`translateY(${8-reveal*8}px) scale(${.96+reveal*.04})`}}>
      <img src={upcoming.image} alt="" loading="eager" decoding="sync" fetchpriority="high"/><div className="veil"/>
      <div className="badge"><span>✿</span><b>Rare bloom</b></div>
      <div className="info"><Info size={20}/></div>
      <aside><div><Flower2/><span>Rare</span></div><div><Sun/><span>Loves Sun</span></div><div><Droplets/><span>Medium<br/>Water</span></div></aside>
      <div className="card-copy"><p className="origin"><MapPin/> {upcoming.origin}</p><h1>{upcoming.name}<Sparkles/></h1><p>{upcoming.tagline}<br/>{upcoming.quote}</p><div className="tags">{upcoming.tags.map(t=><span key={t}>{t}</span>)}</div></div>
      <div className="score"><Flower2/><b>{upcoming.match}%</b><span>Match</span></div>
    </div>
    <article key={index} className="card" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={()=>{if(!didDrag.current&&!animating)openDetail(flower)}}
      style={{transform:`translate3d(${drag.x}px,0,0) rotate(${drag.x/30}deg)`,opacity:Math.abs(drag.x)>360?.1:1,transition:drag.start===null&&animating?'transform .75s cubic-bezier(.16,.74,.18,1), opacity .68s ease':drag.start===null?'transform .58s cubic-bezier(.16,.74,.18,1)':'none'}}>
      <img src={flower.image} alt={flower.name} loading="eager" decoding="sync" fetchpriority="high"/><div className="veil"/>
      {Math.abs(drag.x)>35&&<div className={`stamp ${drag.x>0?'yes':'no'}`}>{drag.x>0?'BLOOM':'PASS'}</div>}
      <div className="badge"><span>✿</span><b>Rare bloom</b></div>
      <button className="info"><Info size={20}/></button>
      <aside><div><Flower2/><span>Rare</span></div><div><Sun/><span>Loves Sun</span></div><div><Droplets/><span>Medium<br/>Water</span></div></aside>
      <div className="card-copy"><p className="origin"><MapPin/> {flower.origin}</p><h1>{flower.name}<Sparkles/></h1><p>{flower.tagline}<br/>{flower.quote}</p><div className="tags">{flower.tags.map(t=><span key={t}>{t}</span>)}</div></div>
      <div className="score"><Flower2/><b>{flower.match}%</b><span>Match</span></div>
    </article>
    </section>
   </>}
   </section>
   <footer className={`bottom-zone ${activeTab==='garden'?'nav-only':'discover-zone'}`}>
    {activeTab!=='garden'&&
    <><div className="hint">Swipe to discover<br/>your perfect bloom <span>↝</span></div>
    <section className="actions">
    <IconButton label="Undo" onClick={()=>setIndex(v=>Math.max(0,v-1))}><RotateCcw/></IconButton>
    <IconButton label="Pass" onClick={()=>next('skip')}><X/></IconButton>
    <IconButton label="Bloom" className={`primary ${liked?'liked':''}`} onClick={()=>next('like')}><Flower2 fill="white"/></IconButton>
    <IconButton label="Like" onClick={()=>next('like')}><Heart fill="currentColor"/></IconButton>
    <IconButton label="Message"><MessageCircle fill="currentColor"/></IconButton>
    </section></>}
    <nav className="ios-glass-nav">
    <span className="glass-shine" aria-hidden="true" />
    <button className={activeTab==='discover'?'active':''} onClick={()=>setActiveTab('discover')}><span className="nav-icon"><Flower2 fill="currentColor"/></span><span>Discover</span></button>
    <button className={activeTab==='garden'?'active':''} onClick={()=>setActiveTab('garden')}><span className="nav-icon"><Gift/></span><span>Garden</span></button>
    <button className={activeTab==='matches'?'active':''} onClick={()=>setActiveTab('matches')}><span className="nav-icon"><Heart/></span><i>12</i><span>Matches</span></button>
    <button className={activeTab==='messages'?'active':''} onClick={()=>setActiveTab('messages')}><span className="nav-icon"><MessageCircle/></span><i>3</i><span>Messages</span></button>
    <button className={activeTab==='profile'?'active':''} onClick={()=>setActiveTab('profile')}><span className="nav-icon"><UserRound/></span><span>Profile</span></button>
    </nav>
   </footer>
   {detailFlower&&<div className="discover-detail" role="dialog" aria-modal="true" aria-label={`Chi tiết ${detailFlower.name}`} onClick={closeDetail}>
    <article className="discover-detail-card" onClick={e=>e.stopPropagation()}>
     <button className="detail-close" aria-label="Đóng chi tiết" onClick={closeDetail}><X/></button>
     <div className="detail-gallery" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setDetailDrag({x:0,start:e.clientX})}} onPointerMove={e=>detailDrag.start!==null&&setDetailDrag(d=>({...d,x:e.clientX-d.start}))} onPointerUp={detailUp} onPointerCancel={detailUp}>
      <img key={`${detailFlower.name}-${detailPhoto}`} className={detailDrag.start!==null?'dragging':''} src={detailGallery[detailPhoto]} alt={`${detailFlower.name} - ảnh ${detailPhoto+1}`} style={{transform:`translate3d(${detailDrag.x}px,0,0)`}} />
      <div className="detail-image-shade" />
      <div className="detail-title"><span><MapPin/> {detailFlower.origin}</span><h2>{detailFlower.name}<Sparkles/></h2></div>
      <div className="detail-dots">{detailGallery.map((_,i)=><button key={i} className={i===detailPhoto?'active':''} aria-label={`Xem ảnh ${i+1}`} onClick={()=>setDetailPhoto(i)} />)}</div>
     </div>
     <button className="detail-arrow previous" aria-label="Ảnh trước" onClick={()=>changeDetailPhoto(-1)}><ChevronLeft/></button>
     <button className="detail-arrow next" aria-label="Ảnh tiếp theo" onClick={()=>changeDetailPhoto(1)}><ChevronRight/></button>
     <section className="detail-copy">
      <p className="detail-lead">{detailFlower.tagline} {detailFlower.quote}</p>
      <div className="detail-tags">{detailFlower.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
      <div className="detail-facts"><div><Sun/><span>Ánh sáng</span><b>{detailFlower.light||'Chưa cập nhật'}</b></div><div><Droplets/><span>Tưới nước</span><b>{detailFlower.water||'Chưa cập nhật'}</b></div><div><Flower2/><span>Độ hiếm</span><b>{detailFlower.rarity||'Chưa cập nhật'}</b></div></div>
      <button className="detail-action">{detailFlower.price?<ShoppingBag/>:<Heart fill="currentColor"/>}<span>{detailFlower.price?`${detailFlower.price} · Thêm vào giỏ`:'Chọn đóa hoa này'}</span></button>
     </section>
    </article>
   </div>}
   {notice&&<div className="toast">{notice}</div>}
 </main>
}
function Storefront(){
 const [catalog,setCatalog]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(!!supabase);
 const firstLoad=useRef(true);
 useEffect(()=>{if(loading)return;const cover=document.getElementById('startup-cover');if(!cover)return;const frame=requestAnimationFrame(()=>cover.classList.add('ready'));const timer=setTimeout(()=>cover.remove(),1000);return()=>{cancelAnimationFrame(frame);clearTimeout(timer)}},[loading]);
 async function load(){
  if(!supabase)return;
  setError('');
  try{const {data,error}=await supabase.from('products').select('*').eq('published',true).order('created_at',{ascending:false});if(error)throw error;const products=data.map(productView);if(firstLoad.current){firstLoad.current=false;const lead=products.find(item=>item.featured)||products[0];if(lead)await Promise.race([new Promise(resolve=>{const image=new Image();image.onload=()=>{image.decode().catch(()=>{}).then(resolve)};image.onerror=resolve;image.src=lead.image}),new Promise(resolve=>setTimeout(resolve,3500))])}setCatalog(products)}catch(error){setError(error.message)}finally{setLoading(false)}
 }
 useEffect(()=>{load();if(!supabase)return;const refresh=()=>load();window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh)},[]);
 if(loading)return <main className="catalog-status" aria-busy="true" aria-label="Đang tải bộ sưu tập"/>;
 if(error)return <main className="catalog-status"><p>Không thể tải sản phẩm. Vui lòng thử lại.</p><button onClick={load}>Tải lại</button></main>;
 if(catalog&&!catalog.length)return <main className="catalog-status"><h1>Elégant Florist</h1><p>Bộ sưu tập đang được cập nhật.</p><a href="/admin">Quản lý sản phẩm</a></main>;
 return <App catalog={catalog}/>;
}
if(window.location.pathname.startsWith('/admin'))document.getElementById('startup-cover')?.remove();
createRoot(document.getElementById('root')).render(window.location.pathname.startsWith('/admin')?<Admin/>:<Storefront/>);
