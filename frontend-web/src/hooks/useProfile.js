import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";
import { ensureProfile, updateAccountEmail, updateAccountMetadata, updateProfile as saveProfile, uploadProfileAvatar } from "../services/profileService.js";
import { useAuth } from "./useAuth.js";

export function useProfile() {
  const { user } = useAuth();
  const [profile,setProfile]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  const refresh=useCallback(async()=>{if(!user){setProfile(null);setLoading(false);return;}try{setError("");const saved=await ensureProfile(user);setProfile({...saved,birthday:user.user_metadata?.birthday||"",gender:user.user_metadata?.gender||""});}catch(reason){setError(reason.message);}finally{setLoading(false);}},[user]);
  useEffect(()=>{refresh();if(!user)return undefined;const channel=supabase.channel(`profile-${user.id}-${crypto.randomUUID()}`).on("postgres_changes",{event:"*",schema:"public",table:TABLES.PROFILES,filter:`id=eq.${user.id}`},refresh).subscribe();return()=>{supabase.removeChannel(channel);};},[refresh,user]);
  const updateProfile=async(updates)=>{try{setError("");const { email,birthday,gender,...fields }=updates;const saved=await saveProfile(user.id,fields);if(birthday!==undefined||gender!==undefined)await updateAccountMetadata({...user.user_metadata,birthday,gender});if(email&&email!==user.email)await updateAccountEmail(email);const merged={...saved,birthday:birthday||"",gender:gender||""};setProfile(merged);return {data:merged,error:null};}catch(reason){setError(reason.message);return {data:null,error:reason};}};
  const uploadAvatar=async(file)=>{try{const saved=await uploadProfileAvatar(user.id,file);setProfile(saved);return {data:saved,error:null};}catch(reason){setError(reason.message);return {data:null,error:reason};}};
  return { profile, user, loading, error, updateProfile, uploadAvatar, refresh };
}
