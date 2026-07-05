import { supabase } from '@/lib/supabaseClient'
import { toPrefixQuery } from '@/lib/textSearch'

export async function fetchPublicMiniGames(search = '', filters = {}) {
  let query = supabase.from('mini_games_public_view').select('*')
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value)
  }
  if (search.trim()) {
    query = query.textSearch('search_vector', toPrefixQuery(search), { config: 'vietnamese' })
  }
  const { data, error } = await query
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchAllMiniGames() {
  const { data, error } = await supabase
    .from('mini_games')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createMiniGame(game) {
  const { data, error } = await supabase.from('mini_games').insert(game).select().single()
  if (error) throw error
  return data
}

export async function updateMiniGame(id, updates) {
  const { data, error } = await supabase
    .from('mini_games')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMiniGame(id) {
  const { error } = await supabase.from('mini_games').delete().eq('id', id)
  if (error) throw error
}

export async function uploadMiniGameFile(file) {
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from('mini_games').upload(path, file)
  if (error) throw error
  return path
}

export async function getMiniGameSignedUrl(path, downloadName) {
  const { data, error } = await supabase.storage
    .from('mini_games')
    .createSignedUrl(path, 3600, { download: downloadName ?? true })
  if (error) throw error
  return data.signedUrl
}

export async function unlockMiniGamePayload(id, password) {
  const { data, error } = await supabase.rpc('get_locked_mini_game_payload', { p_id: id, p_password: password })
  if (error) throw error
  return data
}
