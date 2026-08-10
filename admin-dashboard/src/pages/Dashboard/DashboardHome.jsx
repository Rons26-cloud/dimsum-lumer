import { useEffect, useState } from "react";
import Loading from "../../components/ui/Loading.jsx";
import DashboardHeader from "../../components/dashboard/DashboardHeader.jsx";
import MetricsGrid from "../../components/dashboard/MetricsGrid.jsx";
import SalesChartCard from "../../components/dashboard/SalesChartCard.jsx";
import StoreControlCard from "../../components/dashboard/StoreControlCard.jsx";
import InsightsGrid from "../../components/dashboard/InsightsGrid.jsx";
import ApkControlCard from "../../components/dashboard/ApkControlCard.jsx";
import RecentOrdersTable from "../../components/dashboard/RecentOrdersTable.jsx";
import ApkReleaseModal from "../../components/dashboard/ApkReleaseModal.jsx";
import ProductCatalogOverview from "../../components/dashboard/ProductCatalogOverview.jsx";
import { useDashboardStats } from "../../hooks/useDashboardStats.js";
import { updateConfig, updateOrderStatus, updateStoreInfo, uploadApk } from "../../services/dashboardService.js";
import { mergeFrontendCatalog } from "../../data/frontendCatalog.js";

export default function DashboardHome() {
  const data=useDashboardStats();
  const [store,setStore]=useState({});
  const [apk,setApk]=useState({});
  const [file,setFile]=useState(null);
  const [apkOpen,setApkOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState(null);

  useEffect(()=>setStore(data.storeInfo||{}),[data.storeInfo]);
  useEffect(()=>setApk(data.apkVersion||{}),[data.apkVersion]);

  const execute=async(action,success)=>{
    setSaving(true); setNotice(null);
    try { await action(); if(success)setNotice({type:"success",text:success}); }
    catch(error){setNotice({type:"error",text:error.message||"Operasi gagal dilakukan."}); throw error;}
    finally{setSaving(false);}
  };
  const saveStore=(next=store)=>execute(()=>updateStoreInfo(next),"Informasi toko berhasil disimpan.").catch(()=>{});
  const toggleStore=(is_open)=>{const next={...store,is_open};setStore(next);saveStore(next);};
  const saveApk=async(event)=>{
    event.preventDefault();
    try { await execute(async()=>{const uploaded=await uploadApk(file,apk.version);const next={...apk,download_url:uploaded?.url||apk.download_url,file_size:uploaded?.size||apk.file_size||0,storage_path:uploaded?.path||apk.storage_path,uploaded_at:new Date().toISOString()};await updateConfig("apk_version",next);setApk(next);},"Versi APK berhasil diterbitkan.");setFile(null);setApkOpen(false); }
    catch { /* pesan sudah disimpan oleh execute */ }
  };
  const changeOrderStatus=(id,status)=>execute(()=>updateOrderStatus(id,status),"Status pesanan berhasil diperbarui.").catch(()=>{});

  if(data.loading)return <div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-gray-200"/><div className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((item)=><div key={item} className="h-28 animate-pulse rounded-2xl bg-gray-100"/>)}</div><Loading/></div>;
  return <div className="animate-fade-in space-y-5 sm:space-y-6">
    <DashboardHeader realtimeStatus={data.realtimeStatus} lastUpdated={data.lastUpdated} refreshing={data.refreshing} onRefresh={data.refresh}/>
    {(data.error||notice)&&<div role="alert" className={`rounded-xl border p-3 text-sm ${(data.error||notice?.type==="error")?"border-red-200 bg-red-50 text-red-700":"border-green-200 bg-green-50 text-green-700"}`}>{data.error||notice.text}</div>}
    <MetricsGrid data={data}/>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3"><SalesChartCard data={data.salesChart}/><StoreControlCard compact store={store} saving={saving} onChange={setStore} onSave={()=>saveStore()} onToggle={toggleStore}/></div>
    <InsightsGrid bestSellers={data.bestSellers} categories={data.categories} statuses={data.orderStatuses||{}} totalOrders={data.totalOrders}/>
    <ProductCatalogOverview products={mergeFrontendCatalog(data.productCatalog)}/>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3"><ApkControlCard apk={apk} storage={data.apkStorage} onManage={()=>setApkOpen(true)}/><RecentOrdersTable orders={data.recentOrders} saving={saving} onStatusChange={changeOrderStatus}/></div>
    <ApkReleaseModal open={apkOpen} apk={apk} file={file} saving={saving} onClose={()=>setApkOpen(false)} onApkChange={setApk} onFileChange={setFile} onSubmit={saveApk}/>
  </div>;
}
