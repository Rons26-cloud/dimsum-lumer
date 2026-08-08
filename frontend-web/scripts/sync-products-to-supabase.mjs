import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envText=await readFile(resolve('.env'),'utf8');
const localEnv=Object.fromEntries(envText.split(/\r?\n/).filter(line=>line&&!line.startsWith('#')&&line.includes('=')).map(line=>{const index=line.indexOf('=');return [line.slice(0,index).trim(),line.slice(index+1).trim()];}));
const url=process.env.SUPABASE_URL||localEnv.VITE_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!serviceKey)throw new Error('Set SUPABASE_SERVICE_ROLE_KEY sebagai environment variable lokal sebelum menjalankan sinkronisasi.');
const supabase=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const products=[
  ['10000000-0000-4000-8000-000000000001','Dimsum Ayam Original','Dimsum ayam juicy dengan kulit tipis, isi 4.',20000,'original.jpg'],
  ['10000000-0000-4000-8000-000000000002','Dimsum Udang','Dimsum dengan isian udang segar pilihan.',20000,'udang.jpg'],
  ['10000000-0000-4000-8000-000000000003','Dimsum Mozarella','Dimsum ayam dengan keju mozarella lumer.',18000,'mozarella.jpg'],
  ['10000000-0000-4000-8000-000000000004','Pangsit Goreng Lumer','Pangsit ayam udang renyah dengan saus spesial.',18000,'pangsit-goreng-lumer.jpg'],
  ['10000000-0000-4000-8000-000000000005','Dimsum Pedas','Dimsum ayam dengan saus cabai pedas spesial.',20000,'pedas.jpg'],
  ['10000000-0000-4000-8000-000000000006','Dimsum Keju','Dimsum gurih dengan saus dan parutan keju.',20000,'keju.jpg'],
  ['10000000-0000-4000-8000-000000000007','Dimsum BBQ','Dimsum dengan saus BBQ manis dan smoky.',22000,'bbq.jpg'],
  ['10000000-0000-4000-8000-000000000008','Dimsum Mix','Kombinasi berbagai varian dimsum favorit.',22000,'mix.jpg'],
  ['10000000-0000-4000-8000-000000000009','Dimsum Jagung','Dimsum ayam dengan topping jagung manis.',20000,'jagung.jpg'],
  ['10000000-0000-4000-8000-000000000010','Dimsum Jamur','Dimsum ayam dengan jamur gurih pilihan.',20000,'jamur.jpg'],
  ['10000000-0000-4000-8000-000000000011','Dimsum Sosis','Dimsum ayam dengan topping sosis panggang.',20000,'sosis.jpg'],
  ['10000000-0000-4000-8000-000000000012','Dimsum Ayam Premium','Dimsum berisi ayam premium yang padat dan juicy.',25000,'ayampremium.jpg'],
];
const {error:bucketError}=await supabase.storage.createBucket('product-images',{public:true,fileSizeLimit:5242880,allowedMimeTypes:['image/jpeg','image/png','image/webp']});
if(bucketError&&!/already exists/i.test(bucketError.message))throw bucketError;
const slugify=(value)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
for(const [id,name,description,price,file] of products){
  const bytes=await readFile(resolve('src/assets/produk',file));
  const path=`catalog/${file}`;
  const {error:uploadError}=await supabase.storage.from('product-images').upload(path,bytes,{contentType:'image/jpeg',upsert:true,cacheControl:'3600'});
  if(uploadError)throw new Error(`${file}: ${uploadError.message}`);
  const {data}=supabase.storage.from('product-images').getPublicUrl(path);
  const imageUrl=`${data.publicUrl}?v=${Date.now()}`;
  const {error:productError}=await supabase.from('products').upsert({id,slug:slugify(name),name,description,price,stock:100,is_active:true,sold_count:0,image_url:imageUrl,image:imageUrl},{onConflict:'id'});
  if(productError)throw new Error(`${name}: ${productError.message}`);
  console.log(`OK ${name} -> ${basename(path)}`);
}
console.log(`Sinkronisasi selesai: ${products.length} produk dan gambar sudah masuk Supabase.`);
