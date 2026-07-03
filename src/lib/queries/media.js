import { supabase } from '@/lib/supabaseClient'
import { toPrefixQuery } from '@/lib/textSearch'

export async function fetchPublicMedia(search = '') {
  let query = supabase.from('media_public_view').select('*')
  if (search.trim()) {
    query = query.textSearch('search_vector', toPrefixQuery(search), { config: 'vietnamese' })
  }
  const { data, error } = await query.order('created_at', { ascending: false })
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

export async function unlockMediaReview(id, password) {
  const { data, error } = await supabase.rpc('get_locked_media_review', { p_id: id, p_password: password })
  if (error) throw error
  return data
}
