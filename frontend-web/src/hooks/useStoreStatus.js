import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase/client.js';
import { useRealtime } from './useRealtime.js';

const DEFAULT_STORE = { is_open: true, open_time: '08:00', close_time: '21:00' };
const configValue = (row) => row?.value || row?.config_value || {};

export function useStoreStatus() {
  const [store, setStore] = useState(DEFAULT_STORE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    const { data, error: queryError } = await supabase.from('app_config').select('*').eq('key', 'store_info').maybeSingle();
    if (queryError) setError(queryError.message);
    else { setStore({ ...DEFAULT_STORE, ...configValue(data) }); setError(''); }
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtime('app_config', '*', refresh, 'key=eq.store_info');
  return { ...store, isOpen: store.is_open !== false, loading, error, refresh };
}

export function useApkVersion() {
  const [config, setConfig] = useState(null);
  const refresh = useCallback(async () => { const { data } = await supabase.from('app_config').select('*').eq('key', 'apk_version').maybeSingle(); setConfig(configValue(data)); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtime('app_config', '*', refresh, 'key=eq.apk_version');
  return config;
}

export function useStoreLocation() {
  const [store,setStore]=useState(null);
  const [loading,setLoading]=useState(true);
  const refresh=useCallback(async()=>{const {data:config}=await supabase.from('app_config').select('*').eq('key','store_info').maybeSingle();const official=configValue(config);if(official?.address&&!/contoh alamat/i.test(official.address)){setStore(official);setLoading(false);return;}const {data}=await supabase.from('stores').select('*').order('created_at',{ascending:true}).limit(1).maybeSingle();setStore(data&&!/contoh alamat/i.test(data.address||'')?data:null);setLoading(false);},[]);
  useEffect(()=>{refresh()},[refresh]);
  useRealtime('stores','*',refresh);
  useRealtime('app_config','*',refresh,'key=eq.store_info');
  return {store,loading,refresh};
}
