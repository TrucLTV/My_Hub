import { supabase } from '@/lib/supabaseClient'

export async function fetchSiteSettings() {
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single()
  if (error) throw error
  return data
}

export async function setDownloadPassword(newPassword) {
  const { error } = await supabase.rpc('set_download_password', { p_new_password: newPassword })
  if (error) throw error
}
