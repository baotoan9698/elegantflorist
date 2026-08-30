import React, {useEffect, useRef, useState} from 'react';
import {supabase, slugify} from './supabase';
import {flowers, gardenProducts} from './sampleCatalog';
import categoryMigration from '../supabase/categories.sql?raw';
import multiCategoryMigration from '../supabase/product-categories.sql?raw';
import deleteCategoryMigration from '../supabase/delete-category.sql?raw';
import {getProductCategories} from './productCategories';
import './admin.css';

const empty = () => ({name:'',slug:'',category:'',categories:[],price_vnd:0,origin:'',tagline:'',description:'',tags:'',light:'',water:'',rarity:'',published:false,featured:true});
export default function Admin(){
 const [session,setSession]=useState(null), [checking,setChecking]=useState(true), [allowed,setAllowed]=useState(false);
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState('');
 const [products,setProducts]=useState([]),[form,setForm]=useState(empty),[pictures,setPictures]=useState([]),[busy,setBusy]=useState(false);
 const [categories,setCategories]=useState([]),[categoryName,setCategoryName]=useState(''),[categoryError,setCategoryError]=useState(''),[categoriesReady,setCategoriesReady]=useState(false);
 const [multiCategoryReady,setMultiCategoryReady]=useState(false);
 const categoryOptions=[...new Set([...categories.map(item=>item.name),...products.flatMap(getProductCategories),...form.categories].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
 const toggleCategory=name=>setForm(current=>({...current,categories:current.categories.includes(name)?current.categories.filter(value=>value!==name):[...current.categories,name]}));
 async function checkMultiCategory(){const {error}=await supabase.from('products').select('categories').limit(0);setMultiCategoryReady(!error)}
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
  if(error)throw error;setProducts(data);await checkMultiCategory();
 }
 useEffect(()=>{if(allowed)load().catch(error=>setMessage(error.message))},[allowed]);
 async function loadCategories(){
  setCategoriesReady(false);
  try{
   const {data,error}=await supabase.from('categories').select('id,name').order('name');
   if(error)throw error;
   setCategories(data);setCategoryError('');setCategoriesReady(true);
  }catch(error){setCategoryError(['PGRST205','42P01'].includes(error.code)?'Cần thiết lập bảng danh mục trên Supabase. Chạy SQL bên dưới, rồi bấm Tải lại danh mục.':`Không tải được danh mục: ${error.message}`)}
 }
 useEffect(()=>{if(allowed)loadCategories()},[allowed]);
 async function createCategory(event){
  event.preventDefault();const name=categoryName.trim().replace(/\s+/g,' ');
  if(!name||name.length>80){setMessage('Tên danh mục cần từ 1 đến 80 ký tự.');return}
  if(categoryOptions.some(item=>item.trim().toLocaleLowerCase('vi')===name.toLocaleLowerCase('vi'))){setMessage('Danh mục này đã tồn tại. Hãy chọn trong danh sách bên dưới.');return}
  setBusy(true);setMessage('');
  try{
   const {data,error}=await supabase.from('categories').insert({name}).select('id,name').single();
   if(error)throw error;
   setCategories(current=>[...current,data]);setForm(current=>({...current,categories:[...new Set([...current.categories,data.name])]}));setCategoryName('');setMessage(`Đã tạo và thêm danh mục “${data.name}” vào lựa chọn. Bấm Lưu sản phẩm để áp dụng.`);
  }catch(error){setMessage(error.code==='23505'?'Danh mục này đã tồn tại. Bấm Tải lại danh mục.':`Chưa tạo được danh mục: ${error.message}`)}finally{setBusy(false)}
 }
 function edit(row){
  previewUrls.current.forEach(url=>URL.revokeObjectURL(url));previewUrls.current=[];
  setForm(row?{...row,categories:getProductCategories(row),tags:row.tags.join(', ')}:empty());setPictures(row?row.images.map(url=>({url})):[]);setMessage('');
 }
 async function deleteCategory(item){
  if(busy)return;
  if(!window.confirm(`Xóa danh mục “${item.name}”? Chỉ xóa được khi không còn sản phẩm sử dụng danh mục này.`))return;
  setBusy(true);setMessage('');
  try{
   const {error}=await supabase.rpc('delete_flower_category',{category_id:item.id});
   if(error)throw error;
   setCategories(current=>current.filter(category=>category.id!==item.id));
   setForm(current=>({...current,categories:current.categories.filter(name=>name!==item.name)}));
   setMessage(`Đã xóa danh mục “${item.name}”. Không xóa sản phẩm hoặc ảnh.`);
   await load();
  }catch(error){setMessage(error.code==='PGRST202'?'Cần chạy SQL bật xóa danh mục ở phần bên dưới trước khi sử dụng.':`Chưa xóa được: ${error.message}`)}finally{setBusy(false)}
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
 async function importSamples(){
  setBusy(true);let imported=0,skipped=0;
  try{
   const {data:existing,error:readError}=await supabase.from('products').select('slug');
   if(readError)throw readError;
   const slugs=new Set(existing.map(row=>row.slug));
   for(const [index,item] of gardenProducts.entries()){
    const slug=slugify(item.name);
    if(slugs.has(slug)){skipped++;continue}
    setMessage(`Đang nhập mẫu ${index+1}/${gardenProducts.length}: ${item.name}…`);
    const response=await fetch(item.image);if(!response.ok)throw new Error(`Không đọc được ảnh ${item.name}`);
    const image=await response.blob();if(!image.type.startsWith('image/'))throw new Error(`File không phải ảnh: ${item.name}`);
    // Deterministic paths permit retry without uploading duplicate assets.
    const path=`sample-import/${slug}-v1.jpg`;
    const {error:uploadError}=await supabase.storage.from('flower-images').upload(path,image,{contentType:'image/jpeg',cacheControl:'31536000',upsert:false});
    if(uploadError&&String(uploadError.statusCode)!=='409'&&uploadError.message!=='The resource already exists')throw uploadError;
    const imageUrl=supabase.storage.from('flower-images').getPublicUrl(path).data.publicUrl;
    const source=flowers.find(flower=>flower.image===item.image)||flowers[0];
    const payload={name:item.name,slug,category:item.category,price_vnd:Number(item.price.replace(/\D/g,'')),origin:source.origin,tagline:source.tagline,description:source.quote,tags:source.tags,images:[imageUrl],light:'',water:'',rarity:'',published:true,featured:flowers.some(flower=>flower.image===item.image)};
    if(multiCategoryReady)payload.categories=[item.category];
    const {error:insertError}=await supabase.from('products').insert(payload);
    if(insertError){if(insertError.code==='23505'){skipped++;continue}throw insertError}
    slugs.add(slug);imported++;
   }
   await load();setMessage(`Đã nhập ${imported} sản phẩm mẫu, bỏ qua ${skipped} sản phẩm đã có. Ảnh đã lưu trên Supabase Storage.`);
  }catch(error){setMessage(`Đã nhập ${imported} sản phẩm, bỏ qua ${skipped}. Dừng vì: ${error.message}. Có thể bấm nhập lại để tiếp tục, không ghi đè sản phẩm đã có.`);await load().catch(()=>{})}
  finally{setBusy(false)}
 }
 async function save(event){
  event.preventDefault();setMessage('');
  if(!form.categories.length||form.categories.some(name=>!categoryOptions.includes(name))){setMessage('Vui lòng chọn ít nhất một danh mục.');return}
  if(!multiCategoryReady&&form.categories.length>1){setMessage('Cần chạy SQL nâng cấp nhiều danh mục trước khi lưu nhiều lựa chọn. Các thay đổi chưa được lưu.');return}
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
   const payload={id,name:form.name.trim(),slug:form.slug||slugify(form.name),category:form.categories[0],price_vnd:Number(form.price_vnd),origin:form.origin.trim(),tagline:form.tagline.trim(),description:form.description.trim(),tags:form.tags.split(',').map(s=>s.trim()).filter(Boolean),light:form.light,water:form.water,rarity:form.rarity,published:form.published,featured:form.featured,images};
   if(multiCategoryReady)payload.categories=form.categories;
   const {data,error}=await supabase.from('products').upsert(payload).select().single();
   if(error)throw error;
   // Uploaded files now belong to a saved product; never remove them if list refresh fails.
   uploaded.length=0;edit(data);await load();setMessage('Đã lưu. Sản phẩm xuất bản sẽ hiển thị trên website khi tải lại.');
  }catch(error){
   if(uploaded.length)await supabase.storage.from('flower-images').remove(uploaded);
   setMessage(`Chưa hoàn tất: ${error.message}`);
  }finally{setBusy(false)}
 }
 const field=(name,label,type='text')=>name==='category'?<fieldset className="admin-category-select"><legend>{label} — chọn nhiều</legend><div>{categoryOptions.map(name=><label key={name}><input type="checkbox" checked={form.categories.includes(name)} onChange={()=>toggleCategory(name)}/>{name}</label>)}</div><small>Đã chọn {form.categories.length} danh mục. Chọn ít nhất một.</small></fieldset>:<label>{label}<input type={type} min={type==='number'?0:undefined} step={type==='number'?1:undefined} required={['name','price_vnd'].includes(name)} value={form[name]} onChange={e=>setForm({...form,[name]:e.target.value})}/></label>;
 return <main className="admin-page"><div className="admin-container">
  <div className="admin-header"><div><p>ELÉGANT FLORIST</p><h1>Quản lý sản phẩm</h1></div><a href="/">Xem website ↗</a></div>
  {!supabase?<section className="admin-panel"><h2>Kết nối Supabase để bắt đầu</h2><p>Trang quản trị đã sẵn sàng nhưng chưa được kết nối với database.</p><ol><li>Chạy file <code>supabase/schema.sql</code> trong SQL Editor.</li><li>Tạo tài khoản trong Authentication và cấp quyền bằng bảng <code>admin_users</code>.</li><li>Điền <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> vào <code>.env.local</code> rồi khởi động lại website.</li></ol><p>Hướng dẫn đầy đủ: <code>SUPABASE_SETUP.md</code>. Không đưa service-role key vào frontend.</p></section>:
   checking?<p>Đang kiểm tra đăng nhập…</p>:!session?<form className="admin-panel admin-login" onSubmit={login}><h2>Đăng nhập admin</h2><label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Mật khẩu<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy}>Đăng nhập</button></form>:<>
    <div className="admin-toolbar"><span>{session.user.email}</span><button disabled={busy} onClick={async()=>{await supabase.auth.signOut();setAllowed(false);setProducts([]);edit(null)}}>Đăng xuất</button></div>
    {allowed&&<section className="admin-panel admin-categories"><h2>Danh mục sản phẩm</h2><p>Tạo danh mục trước, sau đó chọn danh mục khi thêm hoặc sửa sản phẩm. Danh mục có sản phẩm xuất bản sẽ xuất hiện trong bộ lọc Garden.</p><form onSubmit={createCategory} className="admin-category-form"><label>Tên danh mục mới<input value={categoryName} maxLength={80} required placeholder="Ví dụ: Hoa Sinh Nhật" disabled={busy||!categoriesReady} onChange={e=>setCategoryName(e.target.value)}/></label><button disabled={busy||!categoriesReady||!categoryName.trim()}>＋ Tạo danh mục</button><button type="button" disabled={busy} onClick={loadCategories}>Tải lại danh mục</button></form>{categoryError&&<div className="admin-category-warning" role="alert"><p>{categoryError}</p><details><summary>SQL thiết lập danh mục — chạy một lần trong Supabase SQL Editor</summary><textarea aria-label="SQL thiết lập danh mục" readOnly value={categoryMigration} rows={10}/></details></div>}<div className="admin-category-chips" aria-label="Danh mục hiện có">{categoryOptions.map(name=><button key={name} type="button" disabled={busy} aria-pressed={form.categories.includes(name)} onClick={()=>toggleCategory(name)}>{name}<small>{products.filter(product=>getProductCategories(product).includes(name)).length} sản phẩm</small></button>)}</div></section>}
    {allowed&&<section className="admin-panel" style={{marginBottom:20}}><h3>Xóa danh mục</h3><p>Chuyển sản phẩm sang danh mục khác và lưu trước khi xóa. Bao gồm cả sản phẩm nháp và đã ẩn.</p><div className="admin-category-chips">{categories.map(item=><button type="button" key={item.id} disabled={busy} aria-label={`Xóa danh mục ${item.name}`} onClick={()=>deleteCategory(item)}>× Xóa {item.name}</button>)}</div><details><summary>Thiết lập quyền xóa — chạy SQL này một lần trong Supabase</summary><textarea aria-label="SQL bật xóa danh mục" readOnly value={deleteCategoryMigration} rows={10}/></details></section>}
    {allowed&&!multiCategoryReady&&<section className="admin-panel admin-category-warning" style={{marginBottom:20}}><h3>Bật nhiều danh mục trên Supabase</h3><p>Chạy SQL dưới đây một lần, sau đó bấm Kiểm tra lại. Danh mục cũ được giữ nguyên; trước khi nâng cấp chỉ có thể lưu một lựa chọn.</p><details><summary>SQL nâng cấp nhiều danh mục</summary><textarea aria-label="SQL nâng cấp nhiều danh mục" readOnly value={multiCategoryMigration} rows={7}/></details><button type="button" disabled={busy} onClick={checkMultiCategory}>Kiểm tra lại nhiều danh mục</button></section>}
    {allowed&&<section className="admin-panel" style={{marginBottom:20}}><h2>Dữ liệu mẫu trước đây</h2><p>Nhập 18 sản phẩm và ảnh cũ, giữ tên/giá/mô tả demo và xuất bản lên cửa hàng. Bỏ qua sản phẩm có cùng đường dẫn, không ghi đè nội dung đã sửa. Ba mẫu nổi bật sẽ xuất hiện trong Discover.</p><button disabled={busy} onClick={importSamples}>{busy?'Đang xử lý…':'Nhập 18 sản phẩm mẫu cũ'}</button></section>}
    {allowed&&<div className="admin-layout"><section className="admin-panel admin-list"><button disabled={busy} onClick={()=>edit(null)}>＋ Sản phẩm mới</button><p>{products.length} sản phẩm</p>{products.map(row=><button disabled={busy} className={`admin-product ${form.id===row.id?'selected':''}`} key={row.id} onClick={()=>edit(row)}>{row.images[0]&&<img src={row.images[0]} alt=""/>}<span><strong>{row.name}</strong><small>{row.published?'Đang bán':'Bản nháp / Đã ẩn'}</small></span></button>)}{!products.length&&<p>Chưa có sản phẩm. Thêm sản phẩm đầu tiên bên phải.</p>}</section>
    <form className="admin-panel" onSubmit={save}><fieldset disabled={busy}><h2>{form.id?'Chỉnh sửa sản phẩm':'Thêm sản phẩm'}</h2><div className="admin-fields">{field('name','Tên hoa')}{field('slug','Đường dẫn (để trống để tạo từ tên)')}{field('category','Danh mục')}{field('price_vnd','Giá (VND)','number')}{field('origin','Xuất xứ')}{field('tagline','Mô tả ngắn')}</div><label>Chi tiết hoa<textarea rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>{field('tags','Đặc tính, cách nhau bằng dấu phẩy')}<div className="admin-fields">{field('light','Ánh sáng')}{field('water','Tưới nước')}{field('rarity','Phân loại / Độ hiếm')}</div>
    <h3>Ảnh sản phẩm</h3><p>Ảnh đầu tiên là ảnh bìa. Chỉ gallery của sản phẩm này được hiển thị trong detail.</p><input aria-label="Tải ảnh sản phẩm" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles}/><div className="admin-pictures">{pictures.map((picture,i)=><div key={picture.url}><img src={picture.url} alt={`Ảnh ${i+1}`}/><small>{i===0?'Ảnh bìa':`Ảnh ${i+1}`}</small><div><button type="button" aria-label={`Đưa ảnh ${i+1} lên trước`} disabled={i===0} onClick={()=>move(i,-1)}>←</button><button type="button" aria-label={`Đưa ảnh ${i+1} ra sau`} disabled={i===pictures.length-1} onClick={()=>move(i,1)}>→</button><button type="button" aria-label={`Bỏ ảnh ${i+1}`} onClick={()=>setPictures(p=>p.filter((_,j)=>j!==i))}>×</button></div></div>)}</div>
    <label className="admin-check"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/>Hiển thị trong Discover</label><label className="admin-check"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})}/>Xuất bản (bỏ chọn để lưu nháp/ẩn)</label><button className="admin-save" disabled={busy}>{busy?'Đang lưu…':'Lưu sản phẩm'}</button></fieldset></form></div>}
   </>}
   {message&&<p className="admin-message" role="status">{message}</p>}
 </div></main>;
}
