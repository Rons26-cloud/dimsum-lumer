import NotificationCard from "./NotificationCard.jsx";
import NotificationEmpty from "./NotificationEmpty.jsx";
const dayStart=(date)=>new Date(date.getFullYear(),date.getMonth(),date.getDate()).getTime();
function label(value){const diff=dayStart(new Date())-dayStart(new Date(value));if(diff===0)return'Hari Ini';if(diff===86400000)return'Kemarin';return'Minggu Lalu';}
export default function NotificationList({ items, loading, onOpen, onNavigate, onDelete }) {
  if(loading)return <div className="space-y-3 p-3">{Array.from({length:4},(_,i)=><div key={i} className="h-24 animate-pulse rounded-3xl bg-white"/>)}</div>;
  if(!items.length)return <NotificationEmpty/>;
  const groups=items.reduce((all,item)=>{const key=label(item.created_at);(all[key] ||= []).push(item);return all;},{});
  return <div className="space-y-5 px-3 pb-6">{Object.entries(groups).map(([group,entries])=><section key={group}><h2 className="mb-2 px-1 text-[11px] font-extrabold text-dark">{group}</h2><div className="space-y-2.5">{entries.map(item=><NotificationCard key={item.id} item={item} onOpen={onOpen} onNavigate={onNavigate} onDelete={onDelete}/>)}</div></section>)}</div>;
}
