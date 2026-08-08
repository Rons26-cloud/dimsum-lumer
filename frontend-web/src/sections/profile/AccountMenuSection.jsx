import AccountMenuItem from "../../components/profile/AccountMenuItem.jsx";
export default function AccountMenuSection({ title='Akun & Aktivitas',items }) { return <section className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm"><h2 className="px-0.5 pb-1 text-[10px] font-extrabold">{title}</h2>{items.map(item=><AccountMenuItem key={item.title} {...item}/>)}</section>; }
