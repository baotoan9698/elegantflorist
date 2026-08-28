import React, {useEffect, useRef, useState} from 'react';
import { createRoot } from 'react-dom/client';
import { Menu, SlidersHorizontal, MapPin, Info, RotateCcw, X, Heart, MessageCircle, Gift, UserRound, Flower2, Droplets, Sun, Sparkles, Search, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import './styles.css';

const flowers = [
  {name:'Blue Rose', origin:'Ecuador', tagline:'Mysterious and unique.', quote:'I stand for the impossible.', image:'/assets/blue-rose.webp', tone:'#89badd', tags:['Elegant','Mysterious','One of a kind'], match:98},
  {name:'Blush Peony', origin:'France', tagline:'Soft, joyful and timeless.', quote:'I bloom at my own pace.', image:'/assets/blush-peony.webp', tone:'#f59aae', tags:['Romantic','Warm','Dreamy'], match:94},
  {name:'Moon Orchid', origin:'Thailand', tagline:'Quietly extraordinary.', quote:'Beauty lives in the details.', image:'/assets/moon-orchid.webp', tone:'#b99adf', tags:['Rare','Calm','Graceful'], match:91}
];

const gardenProducts = [
  {name:'Blue Rose', category:'Hoa Hồng', price:'890.000đ', image:'/assets/blue-rose.webp', position:'50% 42%'},
  {name:'Peony Blush', category:'Hoa Mix', price:'1.090.000đ', image:'/assets/blush-peony.webp', position:'50% 44%'},
  {name:'Moon Orchid', category:'Hoa Lan', price:'790.000đ', image:'/assets/moon-orchid.webp', position:'52% 43%'},
  {name:'Azure Love', category:'Hoa Cưới', price:'1.390.000đ', image:'/assets/blue-rose.webp', position:'42% 34%'},
  {name:'Pink Garden', category:'Hoa Chúc Mừng', price:'990.000đ', image:'/assets/blush-peony.webp', position:'58% 34%'},
  {name:'Orchid Muse', category:'Hoa Mix', price:'1.190.000đ', image:'/assets/moon-orchid.webp', position:'40% 34%'},
  {name:'Morning Blue', category:'Hoa Hồng', price:'850.000đ', image:'/assets/blue-rose.webp', position:'58% 48%'},
  {name:'Sweet Peony', category:'Hoa Cưới', price:'1.250.000đ', image:'/assets/blush-peony.webp', position:'43% 48%'},
  {name:'Purple Poetry', category:'Hoa Lan', price:'920.000đ', image:'/assets/moon-orchid.webp', position:'60% 48%'}
];

const gardenCategories = ['Tất cả','Hoa Hồng','Hoa Mix','Hoa Lan','Hoa Cưới','Hoa Chúc Mừng'];

function IconButton({children, label, className='', onClick}) { return <button aria-label={label} className={`icon-btn ${className}`} onClick={onClick}>{children}</button> }

function Garden(){
 const [category,setCategory]=useState('Tất cả');
 const [selected,setSelected]=useState(null);
 const [photoIndex,setPhotoIndex]=useState(0);
 const [galleryDrag,setGalleryDrag]=useState({x:0,start:null});
 const products=category==='Tất cả'?gardenProducts:gardenProducts.filter(item=>item.category===category);
 const gallery=selected?[selected.image,...flowers.filter(item=>item.image!==selected.image).map(item=>item.image)]:[];
 const changePhoto=direction=>setPhotoIndex(current=>(current+direction+gallery.length)%gallery.length);
 const openProduct=product=>{setSelected(product);setPhotoIndex(0);setGalleryDrag({x:0,start:null})};
 const galleryUp=()=>{
  if(galleryDrag.start===null)return;
  if(Math.abs(galleryDrag.x)>45)changePhoto(galleryDrag.x<0?1:-1);
  setGalleryDrag({x:0,start:null});
 };
 return <section className="garden-view">
   <div className="garden-heading">
    <div><span>Our collection</span><h1>Garden</h1></div>
    <button className="garden-search" aria-label="Tìm kiếm"><Search/></button>
   </div>
   <div className="garden-filters" aria-label="Danh mục hoa">
    {gardenCategories.map(item=><button key={item} className={category===item?'active':''} onClick={()=>setCategory(item)}>{item}</button>)}
   </div>
   <div className="product-grid">
    {products.map((item,i)=><article className="product-tile" key={`${item.name}-${i}`} onClick={()=>openProduct(item)} tabIndex="0" onKeyDown={e=>{if(e.key==='Enter')openProduct(item)}}>
      <img src={item.image} alt={item.name} style={{objectPosition:item.position}} loading="eager" />
      <div className="product-gradient" />
      <button className="product-like" aria-label={`Yêu thích ${item.name}`}><Heart/></button>
      <div className="product-meta"><span>{item.category}</span><h2>{item.name}</h2><p>{item.price}</p></div>
      <button className="product-cart" aria-label={`Thêm ${item.name} vào giỏ`}><ShoppingBag/></button>
    </article>)}
   </div>
   {selected&&<div className="product-modal" role="dialog" aria-modal="true" aria-label={`Thư viện ảnh ${selected.name}`} onClick={()=>setSelected(null)}>
    <div className="product-modal-card" onClick={e=>e.stopPropagation()}>
     <button className="modal-close" aria-label="Đóng thư viện" onClick={()=>setSelected(null)}><X/></button>
     <div className="gallery-track" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setGalleryDrag({x:0,start:e.clientX})}} onPointerMove={e=>galleryDrag.start!==null&&setGalleryDrag(d=>({...d,x:e.clientX-d.start}))} onPointerUp={galleryUp} onPointerCancel={galleryUp}>
      <img key={`${selected.name}-${photoIndex}`} src={gallery[photoIndex]} alt={`${selected.name} - ảnh ${photoIndex+1}`} style={{transform:`translateX(${galleryDrag.x}px)`}} />
     </div>
     <button className="gallery-arrow previous" aria-label="Ảnh trước" onClick={()=>changePhoto(-1)}><ChevronLeft/></button>
     <button className="gallery-arrow next" aria-label="Ảnh tiếp theo" onClick={()=>changePhoto(1)}><ChevronRight/></button>
     <div className="gallery-dots">{gallery.map((_,i)=><button key={i} className={i===photoIndex?'active':''} aria-label={`Xem ảnh ${i+1}`} onClick={()=>setPhotoIndex(i)} />)}</div>
     <div className="modal-product-info"><div><span>{selected.category}</span><h2>{selected.name}</h2><p>{selected.price}</p></div><button><ShoppingBag/><span>Thêm vào giỏ</span></button></div>
    </div>
   </div>}
  </section>
}

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
   <section className={`main-stage ${activeTab==='garden'?'garden-stage':''}`}>
   {activeTab==='garden'?<Garden/>:<>
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
    <article key={index} className="card" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      style={{transform:`translateX(${drag.x}px) rotate(${drag.x/30}deg)`,opacity:Math.abs(drag.x)>360?.1:1,transition:drag.start===null&&animating?'transform .33s cubic-bezier(.2,.72,.2,1), opacity .27s ease':drag.start===null?'transform .36s cubic-bezier(.2,.72,.2,1)':'none'}}>
      <img src={flower.image} alt={flower.name} loading="eager" decoding="sync" fetchpriority="high"/><div className="veil"/>
      {Math.abs(drag.x)>35&&<div className={`stamp ${drag.x>0?'yes':'no'}`}>{drag.x>0?'BLOOM':'PASS'}</div>}
      <div className="badge"><span>✿</span><b>Rare bloom</b></div>
      <button className="info"><Info size={20}/></button>
      <aside><div><Flower2/><span>Rare</span></div><div><Sun/><span>Loves Sun</span></div><div><Droplets/><span>Medium<br/>Water</span></div></aside>
      <div className="card-copy"><p className="origin"><MapPin/> {flower.origin}</p><h1>{flower.name}<Sparkles/></h1><p>{flower.tagline}<br/>{flower.quote}</p><div className="tags">{flower.tags.map(t=><span key={t}>{t}</span>)}</div></div>
      <div className="score"><Flower2/><b>{flower.match}%</b><span>Match</span></div>
    </article>
    </section>
    <div className="hint">Swipe to discover<br/>your perfect bloom <span>↝</span></div>
   </>}
   </section>
   <footer className={`bottom-zone ${activeTab==='garden'?'nav-only':''}`}>
    {activeTab!=='garden'&&
    <section className="actions">
    <IconButton label="Undo" onClick={()=>setIndex(v=>Math.max(0,v-1))}><RotateCcw/></IconButton>
    <IconButton label="Pass" onClick={()=>next('skip')}><X/></IconButton>
    <IconButton label="Bloom" className={`primary ${liked?'liked':''}`} onClick={()=>next('like')}><Flower2 fill="white"/></IconButton>
    <IconButton label="Like" onClick={()=>next('like')}><Heart fill="currentColor"/></IconButton>
    <IconButton label="Message"><MessageCircle fill="currentColor"/></IconButton>
    </section>}
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
