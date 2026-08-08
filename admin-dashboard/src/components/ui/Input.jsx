import { forwardRef } from 'react';

const Input=forwardRef(function Input({label,error,hint,className='',id,...props},ref){
  const inputId=id||props.name;
  return <label htmlFor={inputId} className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</span><input ref={ref} id={inputId} className={`min-h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 ${error?'border-red-400':'border-gray-200'} ${className}`} {...props}/>{error&&<span className="mt-1 block text-[11px] text-red-600">{error}</span>}{!error&&hint&&<span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}</label>;
});
export default Input;
