import React, {useEffect, useRef, useState} from 'react';
import {supabase, slugify} from './supabase';
import './admin.css';

const empty = () => ({name:'',slug:'',category:'Hoa Hồng',price_vnd:0,origin:'',tagline:'',description:'',tags:'',light:'',water:'',rarity:'',published:false,featured:true});
export default function Admin(){
 const [session,setSession]=useState(null), [checking,setChecking]=useState(true), [allowed,setAllowed]=useState(false);
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState('');
 const [products,setProducts]=useState([]),[form,setForm]=useState(empty),[pictures,setPictures]=useState([]),[busy,setBusy]=useState(false);
 const previewUrls=useRef([]);
 useEffect(()=>()=>previewUrls.current.forEach(url=>URL.revokeObjectURL(url)),[]);
 useEffect(()=>{
  if(!supabase){setChecking(false);return}
  supabase.auth.getSession().then(({data,error})=>{if(error)setMessage(error.message);setSession(data.session);setChecking(false)});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setAllowed(false)});
  return()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{
  if(!session)return;
  let active=true;setChecking(true);
  supabase.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle().then(({data,error})=>{
   if(!active)return;
   setChecking(false);setAllowed(!!data&&!error);
   if(error)setMessage(error.message);else if(!data)setMessage('Tài khoản này chưa được cấp quyền admin.');
  });return()=>{active=false};
 },[session]);
 async function load(){
  const {data,error}=await supabase.from('products').select('*').order('created_at',{ascending:false});
  if(error)throw error;setProducts(data);
 }
 useEffect(()=>{if(allowed)load().catch(error=>setMessage(error.message))},[allowed]);
 function edit(row){
  previewUrls.current.forEach(url=>URL.revokeObjectURL(url));previewUrls.current=[];
  setForm(row?{...row,tags:row.tags.join(', ')}:empty());setPictures(row?row.images.map(url=>({url})):[]);setMessage('');
 }
 async function login(event){
  event.preventDefault();setBusy(true);setMessage('');
  try{const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;setPassword('')}catch(error){setMessage(error.message)}finally{setBusy(false)}
 }
 function addFiles(event){
  const files=[...event.target.files];event.target.value='';
  if(files.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)){setMessage('Chọn JPG, PNG hoặc WebP, tối đa 10 MB mỗi ảnh.');return}
  if(pictures.length+files.length>12){setMessage('Tối đa 12 ảnh cho mỗi sản phẩm.');return}
  setPictures(current=>[...current,...files.map(file=>{const url=URL.createObjectURL(file);previewUrls.current.push(url);return {url,file}})]);
 }
 function move(index,delta){setPictures(current=>{const next=[...current];[next[index],next[index+delta]]=[next[index+delta],next[index]];return next})}
 async function save(event){
  event.preventDefault();setMessage('');
  if(form.published&&!pictures.length){setMessage('Cần ít nhất một ảnh trước khi xuất bản.');return}
  setBusy(true);const uploaded=[];
  try{
   const id=form.id||crypto.randomUUID();const images=[];
   for(const [index,picture] of pictures.entries()){
    if(!picture.file){images.push(picture.url);continue}
    setMessage(`Đang tải ảnh ${index+1}/${pictures.length}…`);
    const extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[picture.file.type];
    const path=`${id}/${crypto.randomUUID()}.${extension}`;
    const {error}=await supabase.storage.from('flower-images').upload(path,picture.file,{contentType:picture.file.type,cacheControl:'31536000',upsert:false});
    if(error)throw error;uploaded.push(path);
    images.push(supabase.storage.from('flower-images').getPublicUrl(path).data.publicUrl);
   }
   const payload={id,name:form.name.trim(),slug:form.slug||slugify(form.name),category:form.category.trim(),price_vnd:Number(form.price_vnd),origin:form.origin.trim(),tagline:form.tagline.trim(),description:form.description.trim(),tags:form.tags.split(',').map(s=>s.trim()).filter(Boolean),light:form.light,water:form.water,rarity:form.rarity,published:form.published,featured:form.featured,images};
   const {data,error}=await supabase.from('products').upsert(payload).select().single();
   if(error)throw error;
   // Uploaded files now belong to a saved product; never remove them if list refresh fails.
   uploaded.length=0;edit(data);await load();setMessage('Đã lưu. Sản phẩm xuất bản sẽ hiển thị trên website khi tải lại.');
  }catch(error){
   if(uploaded.length)await supabase.storage.from('flower-images').remove(uploaded);
   setMessage(`Chưa hoàn tất: ${error.message}`);
  }finally{setBusy(false)}
 }
 const field=(name,label,type='text')=><label>{label}<input type={type} min={type==='number'?0:undefined} step={type==='number'?1:undefined} required={['name','category','price_vnd'].includes(name)} value={form[name]} onChange={e=>setForm({...form,[name]:e.target.value})}/></label>;
 return <main className="admin-page"><div className="admin-container">
  <div className="admin-header"><div><p>ELÉGANT FLORIST</p><h1>Quản lý sản phẩm</h1></div><a href="/">Xem website ↗</a></div>
  {!supabase?<section className="admin-panel"><h2>Kết nối Supabase để bắt đầu</h2><p>Trang quản trị đã sẵn sàng nhưng chưa được kết nối với database.</p><ol><li>Chạy file <code>supabase/schema.sql</code> trong SQL Editor.</li><li>Tạo tài khoản trong Authentication và cấp quyền bằng bảng <code>admin_users</code>.</li><li>Điền <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> vào <code>.env.local</code> rồi khởi động lại website.</li></ol><p>Hướng dẫn đầy đủ: <code>SUPABASE_SETUP.md</code>. Không đưa service-role key vào frontend.</p></section>:
   checking?<p>Đang kiểm tra đăng nhập…</p>:!session?<form className="admin-panel admin-login" onSubmit={login}><h2>Đăng nhập admin</h2><label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Mật khẩu<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy}>Đăng nhập</button></form>:<>
    <div className="admin-toolbar"><span>{session.user.email}</span><button disabled={busy} onClick={async()=>{await supabase.auth.signOut();setAllowed(false);setProducts([]);edit(null)}}>Đăng xuất</button></div>
    {allowed&&<div className="admin-layout"><section className="admin-panel admin-list"><button disabled={busy} onClick={()=>edit(null)}>＋ Sản phẩm mới</button><p>{products.length} sản phẩm</p>{products.map(row=><button disabled={busy} className={`admin-product ${form.id===row.id?'selected':''}`} key={row.id} onClick={()=>edit(row)}>{row.images[0]&&<img src={row.images[0]} alt=""/>}<span><strong>{row.name}</strong><small>{row.published?'Đang bán':'Bản nháp / Đã ẩn'}</small></span></button>)}{!products.length&&<p>Chưa có sản phẩm. Thêm sản phẩm đầu tiên bên phải.</p>}</section>
    <form className="admin-panel" onSubmit={save}><fieldset disabled={busy}><h2>{form.id?'Chỉnh sửa sản phẩm':'Thêm sản phẩm'}</h2><div className="admin-fields">{field('name','Tên hoa')}{field('slug','Đường dẫn (để trống để tạo từ tên)')}{field('category','Danh mục')}{field('price_vnd','Giá (VND)','number')}{field('origin','Xuất xứ')}{field('tagline','Mô tả ngắn')}</div><label>Chi tiết hoa<textarea rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>{field('tags','Đặc tính, cách nhau bằng dấu phẩy')}<div className="admin-fields">{field('light','Ánh sáng')}{field('water','Tưới nước')}{field('rarity','Phân loại / Độ hiếm')}</div>
    <h3>Ảnh sản phẩm</h3><p>Ảnh đầu tiên là ảnh bìa. Chỉ gallery của sản phẩm này được hiển thị trong detail.</p><input aria-label="Tải ảnh sản phẩm" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles}/><div className="admin-pictures">{pictures.map((picture,i)=><div key={picture.url}><img src={picture.url} alt={`Ảnh ${i+1}`}/><small>{i===0?'Ảnh bìa':`Ảnh ${i+1}`}</small><div><button type="button" aria-label={`Đưa ảnh ${i+1} lên trước`} disabled={i===0} onClick={()=>move(i,-1)}>←</button><button type="button" aria-label={`Đưa ảnh ${i+1} ra sau`} disabled={i===pictures.length-1} onClick={()=>move(i,1)}>→</button><button type="button" aria-label={`Bỏ ảnh ${i+1}`} onClick={()=>setPictures(p=>p.filter((_,j)=>j!==i))}>×</button></div></div>)}</div>
    <label className="admin-check"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/>Hiển thị trong Discover</label><label className="admin-check"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})}/>Xuất bản (bỏ chọn để lưu nháp/ẩn)</label><button className="admin-save" disabled={busy}>{busy?'Đang lưu…':'Lưu sản phẩm'}</button></fieldset></form></div>}
   </>}
   {message&&<p className="admin-message" role="status">{message}</p>}
 </div></main>;
}
