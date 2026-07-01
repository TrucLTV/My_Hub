import { supabase } from '@/lib/supabaseClient'

export async function fetchPublicNotes(search = '') {
  let query = supabase.from('notes').select('*').eq('is_public', true)
  if (search.trim()) {
    query = query.textSearch('search_vector', search, { type: 'websearch', config: 'simple' })
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
