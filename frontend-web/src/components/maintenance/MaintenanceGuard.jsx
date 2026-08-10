import { useMaintenance } from '../../hooks/useMaintenance.js';
import Loading from '../ui/Loading.jsx';
import { MaintenancePage } from './MaintenancePage.jsx';

export default function MaintenanceGuard({ children }) {
  const { isMaintenance, message, startTime, endTime, loading } = useMaintenance();
  if (loading) return <Loading fullscreen />;
  if (isMaintenance) return <MaintenancePage message={message} startTime={startTime} endTime={endTime} />;
  return children;
}
