import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env=Object.fromEntries(fs.readFileSync(new URL("../.env",import.meta.url),"utf8").split(/\r?\n/).filter((line)=>line&&!line.startsWith("#")&&line.includes("=")).map((line)=>{const index=line.indexOf("=");return [line.slice(0,index).trim(),line.slice(index+1).trim()];}));
const email=process.env.ADMIN_EMAIL;
const password=process.env.ADMIN_PASSWORD;
if(!email||!password)throw new Error("ADMIN_EMAIL dan ADMIN_PASSWORD wajib diberikan melalui environment.");
const supabase=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

let {data,error}=await supabase.auth.signInWithPassword({email,password});
if(error){
  const signup=await supabase.auth.signUp({email,password,options:{data:{full_name:"Rons Saputra"}}});
  if(signup.error)throw signup.error;
  data=signup.data;
  console.log(JSON.stringify({account:"created",emailConfirmationRequired:!data.session,userId:data.user?.id||null}));
}else{
  const profile=await supabase.from("profiles").select("role").eq("id",data.user.id).maybeSingle();
  console.log(JSON.stringify({account:"exists",authenticated:true,userId:data.user.id,role:profile.data?.role||null,profileError:profile.error?.message||null}));
}
await supabase.auth.signOut();
