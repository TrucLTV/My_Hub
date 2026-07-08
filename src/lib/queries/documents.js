import { supabase } from '@/lib/supabaseClient'
import { toPrefixQuery } from '@/lib/textSearch'

export async function fetchPublicDocuments(search = '', filters = {}) {
  let query = supabase.from('documents_public_view').select('*')
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

export async function bulkCreateDocuments(documents) {
  const { data, error } = await supabase.from('documents').insert(documents).select()
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

const COMBINING_DIACRITICS = new RegExp('[̀-ͯ]', 'g')

function toSafeStorageName(filename) {
  return filename
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function uploadDocumentFile(file) {
  const path = `${crypto.randomUUID()}-${toSafeStorageName(file.name)}`
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

export async function unlockDocumentPath(id, password) {
  const { data, error } = await supabase.rpc('get_locked_document_path', { p_id: id, p_password: password })
  if (error) throw error
  return data
}
