import ayam from "../../assets/flashsale/dimsum-ayam-original.jpg";
import mozzarella from "../../assets/flashsale/dimsum-mentai-mozzarella.jpg";
import udang from "../../assets/flashsale/dimsum-udang-spesial.jpg";
import pangsit from "../../assets/flashsale/pangsit-goreng-lumer.jpg";

const images=[ayam,mozzarella,udang,pangsit];
export function resolveFlashSaleImage(product,index=0){const name=(product?.name||"").toLowerCase();if(name.includes("udang"))return udang;if(name.includes("moza")||name.includes("mentai")||name.includes("keju"))return mozzarella;if(name.includes("pangsit"))return pangsit;if(name.includes("ayam")||name.includes("original"))return ayam;return images[index%images.length];}
