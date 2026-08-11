import { useMaintenance } from '../../hooks/useMaintenance.js';
import Loading from '../ui/Loading.jsx';
import { MaintenancePage } from './MaintenancePage.jsx';
import { Clock3, Wrench } from 'lucide-react';

const formatCountdown = (milliseconds) => {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor(total / 3600) % 24;
  const minutes = Math.floor(total / 60) % 60;
  const seconds = total % 60;
  return `${days ? `${days} hari ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function MaintenanceGuard({ children }) {
  const { isMaintenance, isUpcoming, message, startTime, endTime, loading, countdownMs } = useMaintenance();
  if (loading) return <Loading fullscreen />;
  if (isMaintenance) return <MaintenancePage message={message} startTime={startTime} endTime={endTime} />;
  return <><div className={isUpcoming ? 'sticky top-0 z-[100] border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm' : 'hidden'} role="status"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs sm:text-sm"><Wrench size={16} className="text-orange-600"/><strong>Maintenance akan dimulai</strong><span>{startTime ? new Date(startTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span><span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-bold text-orange-700"><Clock3 size={13}/>{formatCountdown(countdownMs)}</span><span className="w-full text-[11px] text-amber-800 sm:w-auto">{message}</span></div></div>{children}</>;
}
