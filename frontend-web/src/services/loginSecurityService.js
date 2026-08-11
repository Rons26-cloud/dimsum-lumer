import { supabase } from "../supabase/client.js";

const DEVICE_KEY="dimsum_lumer_device_id";

function deviceId(){
  let value=localStorage.getItem(DEVICE_KEY);
  if(!value){value=crypto.randomUUID?.()||`device-${Date.now()}-${Math.random().toString(36).slice(2)}`;localStorage.setItem(DEVICE_KEY,value);}
  return value;
}

function describeDevice(){
  const ua=navigator.userAgent||"";const platform=navigator.userAgentData?.platform||navigator.platform||"";
  const android=ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|;|\))/i)?.[1]?.trim();
  const model=android||(/iPad/.test(ua)?"Apple iPad":/iPhone/.test(ua)?"Apple iPhone":/Mac/.test(platform)?"Apple Mac":/Win/.test(platform)?"Windows PC":platform||"Perangkat web");
  const os=/iPhone|iPad|iPod/.test(ua)?`iOS ${ua.match(/OS ([\d_]+)/)?.[1]?.replaceAll("_",".")||""}`.trim():/Android/.test(ua)?`Android ${ua.match(/Android\s([\d.]+)/)?.[1]||""}`.trim():/Windows NT 10/.test(ua)?"Windows 10/11":/Mac OS X/.test(ua)?"macOS":/Linux/.test(ua)?"Linux":platform;
  const browser=/Edg\//.test(ua)?"Microsoft Edge":/CriOS|Chrome\//.test(ua)?"Google Chrome":/FxiOS|Firefox\//.test(ua)?"Mozilla Firefox":/Safari\//.test(ua)?"Safari":"Browser web";
  return{model,os,browser};
}

function currentLocation(){
  if(!navigator.geolocation)return Promise.resolve(null);
  return new Promise((resolve)=>navigator.geolocation.getCurrentPosition(
    ({coords})=>resolve({latitude:coords.latitude,longitude:coords.longitude,accuracy:coords.accuracy}),
    ()=>resolve(null),
    {enableHighAccuracy:false,timeout:7000,maximumAge:300000},
  ));
}

export async function registerCurrentLogin(){
  const info=describeDevice();
  try{
    const details=await navigator.userAgentData?.getHighEntropyValues?.(["model","platform","platformVersion"]);
    if(details?.model?.trim())info.model=details.model.trim();
    if(details?.platform)info.os=`${details.platform} ${details.platformVersion||""}`.trim();
  }catch{}
  const location=await currentLocation();
  const{error}=await supabase.rpc("register_login_device",{
    p_device_id:deviceId(),p_device_name:info.model,p_platform:info.os,p_browser:info.browser,
    p_latitude:location?.latitude??null,p_longitude:location?.longitude??null,p_accuracy:location?.accuracy??null,
  });
  if(error)console.warn("Pencatatan perangkat login belum tersedia:",error.message);
}

let initialized=false;
export function initializeLoginSecurity(){
  if(initialized)return;initialized=true;
  supabase.auth.onAuthStateChange((event,session)=>{
    if(event==="SIGNED_IN"&&session?.user)window.setTimeout(()=>registerCurrentLogin(),0);
  });
}
