import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env=Object.fromEntries(fs.readFileSync(new URL("../.env",import.meta.url),"utf8").split(/\r?\n/).filter((line)=>line&&!line.startsWith("#")&&line.includes("=")).map((line)=>{const index=line.indexOf("=");return [line.slice(0,index).trim(),line.slice(index+1).trim()];}));
const email=process.env.ADMIN_EMAIL;
const password=process.env.ADMIN_PASSWORD;
const serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!email||!password||!serviceRoleKey)throw new Error("ADMIN_EMAIL, ADMIN_PASSWORD, dan SUPABASE_SERVICE_ROLE_KEY wajib diberikan melalui environment lokal.");
if(!env.VITE_SUPABASE_URL)throw new Error("VITE_SUPABASE_URL belum tersedia di admin-dashboard/.env.");
if(password.length<8)throw new Error("ADMIN_PASSWORD minimal 8 karakter.");

const supabase=createClient(env.VITE_SUPABASE_URL,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
let targetUser=null;
for(let page=1;page<=100&&!targetUser;page+=1){
  const result=await supabase.auth.admin.listUsers({page,perPage:1000});
  if(result.error)throw result.error;
  targetUser=result.data.users.find((user)=>user.email?.toLowerCase()===email.trim().toLowerCase())||null;
  if(result.data.users.length<1000)break;
}

if(targetUser){
  const result=await supabase.auth.admin.updateUserById(targetUser.id,{password,email_confirm:true,user_metadata:{...targetUser.user_metadata,full_name:targetUser.user_metadata?.full_name||"Rons Saputra"}});
  if(result.error)throw result.error;
  targetUser=result.data.user;
}else{
  const result=await supabase.auth.admin.createUser({email:email.trim().toLowerCase(),password,email_confirm:true,user_metadata:{full_name:"Rons Saputra"}});
  if(result.error)throw result.error;
  targetUser=result.data.user;
}

const profileResult=await supabase.from("profiles").upsert({id:targetUser.id,user_id:targetUser.id,full_name:targetUser.user_metadata?.full_name||"Rons Saputra",role:"admin",updated_at:new Date().toISOString()},{onConflict:"id"}).select("id,role").single();
if(profileResult.error)throw profileResult.error;
console.log(JSON.stringify({success:true,userId:targetUser.id,email:targetUser.email,role:profileResult.data.role}));
