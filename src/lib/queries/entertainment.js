import { supabase } from '@/lib/supabaseClient'
import { toPrefixQuery } from '@/lib/textSearch'

export async function fetchPublicEntertainment(search = '', filters = {}) {
  let query = supabase.from('entertainment_public_view').select('*')
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value)
  }
  if (search.trim()) {
    query = query.textSearch('search_vector', toPrefixQuery(search), { config: 'vietnamese' })
  }
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchAllEntertainment() {
  const { data, error } = await supabase
    .from('entertainment_items')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createEntertainmentItem(item) {
  const { data, error } = await supabase.from('entertainment_items').insert(item).select().single()
  if (error) throw error
  return data
}

export async function updateEntertainmentItem(id, updates) {
  const { data, error } = await supabase
    .from('entertainment_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEntertainmentItem(id) {
  const { error } = await supabase.from('entertainment_items').delete().eq('id', id)
  if (error) throw error
}

export async function uploadEntertainmentMedia(file) {
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from('entertainment_media').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('entertainment_media').getPublicUrl(path)
  return data.publicUrl
}

export async function unlockEntertainmentContent(id, password) {
  const { data, error } = await supabase.rpc('get_locked_entertainment_content', { p_id: id, p_password: password })
  if (error) throw error
  return data?.[0] ?? null
}
