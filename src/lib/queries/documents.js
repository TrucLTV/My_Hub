import { supabase } from '@/lib/supabaseClient'
import { toPrefixQuery } from '@/lib/textSearch'

export async function fetchPublicDocuments(search = '', filters = {}) {
  let query = supabase.from('documents').select('*').eq('is_public', true)
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

export async function fetchAllDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createDocument(document) {
  const { data, error } = await supabase.from('documents').insert(document).select().single()
  if (error) throw error
  return data
}

export async function updateDocument(id, updates) {
  const { data, error } = await supabase
    .from('documents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDocument(id) {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
}

export async function uploadDocumentFile(file) {
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from('documents').upload(path, file)
  if (error) throw error
  return path
}

export async function getDocumentSignedUrl(path, downloadName) {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, 3600, { download: downloadName ?? true })
  if (error) throw error
  return data.signedUrl
}
