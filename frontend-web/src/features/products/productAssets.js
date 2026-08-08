import original from '../../assets/produk/original.jpg';
import mozarella from '../../assets/produk/mozarella.jpg';
import pedas from '../../assets/produk/pedas.jpg';
import udang from '../../assets/produk/udang.jpg';
import keju from '../../assets/produk/keju.jpg';
import bbq from '../../assets/produk/bbq.jpg';
import mix from '../../assets/produk/mix.jpg';
import jagung from '../../assets/produk/jagung.jpg';
import jamur from '../../assets/produk/jamur.jpg';
import sosis from '../../assets/produk/sosis.jpg';
import ayamPremium from '../../assets/produk/ayampremium.jpg';
import pangsit from '../../assets/produk/pangsit-goreng-lumer.jpg';

export const PRODUCT_IMAGES = [original, mozarella, pedas, udang, keju, bbq, mix, jagung, jamur, sosis, ayamPremium, pangsit];

export const LOCAL_PRODUCTS = [
  { id:'10000000-0000-4000-8000-000000000001', slug:'dimsum-ayam-original', name:'Dimsum Ayam Original', description:'Dimsum ayam juicy dengan kulit tipis, isi 4.', price:20000, stock:100, sold_count:0, rating:4.8, is_active:true, image_url:original },
  { id:'10000000-0000-4000-8000-000000000002', slug:'dimsum-udang', name:'Dimsum Udang', description:'Isian udang segar pilihan dengan tekstur gurih.', price:20000, stock:100, sold_count:0, rating:4.9, is_active:true, image_url:udang },
  { id:'10000000-0000-4000-8000-000000000003', slug:'dimsum-mozarella', name:'Dimsum Mozarella', description:'Ayam premium dan keju mozarella lumer.', price:18000, stock:100, sold_count:0, rating:4.9, is_active:true, image_url:mozarella },
  { id:'10000000-0000-4000-8000-000000000004', slug:'pangsit-goreng-lumer', name:'Pangsit Goreng Lumer', description:'Pangsit ayam udang renyah dengan saus spesial, isi 4.', price:18000, stock:100, sold_count:0, rating:4.7, is_active:true, image_url:pangsit },
  { id:'10000000-0000-4000-8000-000000000005', slug:'dimsum-pedas', name:'Dimsum Pedas', description:'Dimsum ayam dengan saus cabai pedas spesial.', price:20000, stock:100, sold_count:0, rating:4.8, is_active:true, image_url:pedas },
  { id:'10000000-0000-4000-8000-000000000006', slug:'dimsum-keju', name:'Dimsum Keju', description:'Dimsum gurih dengan saus dan parutan keju.', price:20000, stock:100, sold_count:0, rating:4.8, is_active:true, image_url:keju },
  { id:'10000000-0000-4000-8000-000000000007', slug:'dimsum-bbq', name:'Dimsum BBQ', description:'Dimsum dengan saus BBQ manis dan smoky.', price:22000, stock:100, sold_count:0, rating:4.8, is_active:true, image_url:bbq },
  { id:'10000000-0000-4000-8000-000000000008', slug:'dimsum-mix', name:'Dimsum Mix', description:'Kombinasi berbagai varian dimsum favorit.', price:22000, stock:100, sold_count:0, rating:4.9, is_active:true, image_url:mix },
  { id:'10000000-0000-4000-8000-000000000009', slug:'dimsum-jagung', name:'Dimsum Jagung', description:'Dimsum ayam dengan topping jagung manis.', price:20000, stock:100, sold_count:0, rating:4.7, is_active:true, image_url:jagung },
  { id:'10000000-0000-4000-8000-000000000010', slug:'dimsum-jamur', name:'Dimsum Jamur', description:'Dimsum ayam dengan jamur gurih pilihan.', price:20000, stock:100, sold_count:0, rating:4.7, is_active:true, image_url:jamur },
  { id:'10000000-0000-4000-8000-000000000011', slug:'dimsum-sosis', name:'Dimsum Sosis', description:'Dimsum ayam dengan topping sosis panggang.', price:20000, stock:100, sold_count:0, rating:4.7, is_active:true, image_url:sosis },
  { id:'10000000-0000-4000-8000-000000000012', slug:'dimsum-ayam-premium', name:'Dimsum Ayam Premium', description:'Dimsum berisi ayam premium yang padat dan juicy.', price:25000, stock:100, sold_count:0, rating:4.9, is_active:true, image_url:ayamPremium },
];

function productKey(product) {
  const value = `${product?.slug || ''} ${product?.name || product?.title || ''}`.toLowerCase();
  if (value.includes('pangsit') && value.includes('goreng')) return 'pangsit-goreng-lumer';
  if (value.includes('ayam') && value.includes('premium')) return 'dimsum-ayam-premium';
  if (value.includes('udang')) return 'dimsum-udang';
  if (value.includes('mozzarella') || value.includes('mozarella') || value.includes('mentai')) return 'dimsum-mozarella';
  if (value.includes('pedas') || value.includes('spicy') || value.includes('mercon')) return 'dimsum-pedas';
  if (value.includes('keju') || value.includes('cheese')) return 'dimsum-keju';
  if (value.includes('bbq') || value.includes('barbeque') || value.includes('barbecue')) return 'dimsum-bbq';
  if (value.includes('mix') || value.includes('campur')) return 'dimsum-mix';
  if (value.includes('jagung') || value.includes('corn')) return 'dimsum-jagung';
  if (value.includes('jamur') || value.includes('mushroom')) return 'dimsum-jamur';
  if (value.includes('sosis') || value.includes('sausage')) return 'dimsum-sosis';
  if (value.includes('original') || value.includes('ayam')) return 'dimsum-ayam-original';
  return String(product?.slug || product?.id || '').trim();
}

function normalizeProduct(product, fallback) {
  return {
    ...fallback,
    ...product,
    name: String(product?.name || product?.title || fallback?.name || 'Produk Dimsum').trim(),
    slug: String(product?.slug || fallback?.slug || product?.id || '').trim(),
    image_url: product?.image_url || product?.image || fallback?.image_url,
  };
}

export function mergeProductCatalog(serverProducts) {
  if (!Array.isArray(serverProducts)) return LOCAL_PRODUCTS;
  // UUID fallback sama dengan katalog database. Ini menjaga UI tetap tersedia
  // ketika fetch/realtime terputus, tetapi cart tetap memvalidasi produk ke
  // Supabase sehingga fallback tidak pernah membuat transaksi palsu.
  if (!serverProducts.length) return LOCAL_PRODUCTS;

  const serverByKey = new Map(serverProducts.map((item) => [productKey(item), item]));
  const merged = LOCAL_PRODUCTS.map((local) => {
    const server = serverProducts.find((item) => item.id === local.id) || serverByKey.get(productKey(local));
    return normalizeProduct(server || local, local);
  });
  const knownKeys = new Set(merged.map(productKey));
  serverProducts.forEach((server) => {
    if (!knownKeys.has(productKey(server))) merged.push(normalizeProduct(server));
  });
  return merged.filter((item) => item.is_active !== false);
}

export function resolveProductImage(product, index = 0) {
  const name = `${product?.name || product?.title || ''} ${product?.slug || ''}`.toLowerCase();
  if (name.includes('ayam premium') || name.includes('ayampremium')) return ayamPremium;
  if (name.includes('mozzarella') || name.includes('mozarella') || name.includes('mentai')) return mozarella;
  if (name.includes('pedas') || name.includes('spicy') || name.includes('mercon')) return pedas;
  if (name.includes('udang') || name.includes('shrimp')) return udang;
  if (name.includes('keju') || name.includes('cheese')) return keju;
  if (name.includes('bbq') || name.includes('barbeque') || name.includes('barbecue')) return bbq;
  if (name.includes('mix') || name.includes('campur')) return mix;
  if (name.includes('jagung') || name.includes('corn')) return jagung;
  if (name.includes('jamur') || name.includes('mushroom')) return jamur;
  if (name.includes('sosis') || name.includes('sausage')) return sosis;
  if (name.includes('pangsit') || name.includes('goreng')) return pangsit;
  if (name.includes('original') || name.includes('ayam')) return original;
  if (product?.image_url || product?.image) return product.image_url || product.image;
  return PRODUCT_IMAGES[index % PRODUCT_IMAGES.length];
}
