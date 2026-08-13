import { supabase } from "./client.js";

export const signUp = async ({ email, password, options = {} }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options,
  });
  if (error) throw error;
  return data;
};

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  const isEmbedded = window.self !== window.top;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/profil`,
      skipBrowserRedirect: isEmbedded,
    },
  });
  if (error) throw error;
  if (isEmbedded && data?.url) window.top.location.assign(data.url);
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};
