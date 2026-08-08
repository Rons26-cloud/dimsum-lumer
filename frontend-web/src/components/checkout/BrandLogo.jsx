const styles = {
  gojek: 'text-[#00aa13]', gofood: 'text-[#ee2737]', grab: 'text-[#00b14f]', bca: 'text-[#0066ae]',
  gopay: 'text-[#00aed6]', ovo: 'text-[#4c3494]', shopeepay: 'text-[#ee4d2d]',
  dana: 'text-[#118eea]', qris: 'text-neutral-950', cod: 'text-[#e5282d]',
};
const labels = { gojek:'gojek', gofood:'GoFood', grab:'Grab', bca:'BCA', gopay:'gopay', ovo:'OVO', shopeepay:'ShopeePay', dana:'DANA', qris:'QRIS', cod:'COD' };
export function BrandLogo({ brand, className = '' }) {
  return <span aria-hidden="true" className={`inline-flex max-w-full items-center justify-center gap-1 whitespace-nowrap font-black leading-none tracking-tight ${styles[brand] || 'text-gray-700'} ${className}`}>
    {(brand === 'gojek' || brand === 'gofood') && <span className="relative h-4 w-4 rounded-full border-[2.5px] border-current before:absolute before:inset-[3px] before:rounded-full before:bg-current" />}
    {brand === 'grab' && <span className="text-[7px] font-bold">●</span>}
    {brand === 'bca' && <span className="grid h-4 w-4 place-items-center rounded-sm border-2 border-current text-[7px]">◆</span>}
    {brand === 'gopay' && <span className="h-3.5 w-3.5 rounded-full border-[3px] border-current" />}
    {brand === 'shopeepay' && <span className="grid h-4 w-4 place-items-center rounded-[4px] bg-current text-[8px] text-white">S</span>}
    {brand === 'dana' && <span className="grid h-4 w-4 place-items-center rounded-full border-2 border-current text-[8px]">D</span>}
    {brand === 'qris' && <span className="grid h-4 w-4 grid-cols-2 gap-[1px]">{Array.from({ length:4 },(_,index)=><i key={index} className="bg-current" />)}</span>}
    <span className={brand === 'shopeepay' ? 'text-[9px]' : brand === 'grab' ? 'text-sm font-semibold' : 'text-xs'}>{labels[brand] || brand}</span>
  </span>;
}
