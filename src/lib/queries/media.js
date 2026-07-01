import { supabase } from '@/lib/supabaseClient'

export async function fetchPublicMedia() {
  const { data, error } = await supabase
    .from('media_tracker')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchAllMedia() {
  const { data, error } = await supabase
    .from('media_tracker')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createMedia(media) {
  const { data, error } = await supabase.from('media_tracker').insert(media).select().single()
  if (error) throw error
  return data
}

export async function updateMedia(id, updates) {
  const { data, error } = await supabase
    .from('media_tracker')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMedia(id) {
  const { error } = await supabase.from('media_tracker').delete().eq('id', id)
  if (error) throw error
}

export async function uploadCoverImage(file) {
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from('covers').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('covers').getPublicUrl(path)
  return data.publicUrl
}
