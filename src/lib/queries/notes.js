import { supabase } from '@/lib/supabaseClient'
import { toPrefixQuery } from '@/lib/textSearch'

export async function fetchPublicNotes(search = '') {
  let query = supabase.from('notes_public_view').select('*')
  if (search.trim()) {
    query = query.textSearch('search_vector', toPrefixQuery(search), { config: 'vietnamese' })
  }
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchAllNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createNote(note) {
  const { data, error } = await supabase.from('notes').insert(note).select().single()
  if (error) throw error
  return data
}

export async function updateNote(id, updates) {
  const { data, error } = await supabase
    .from('notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

export async function unlockNoteContent(id, password) {
  const { data, error } = await supabase.rpc('get_locked_note_content', { p_id: id, p_password: password })
  if (error) throw error
  return data
}
