import { supabase } from '@/lib/supabaseClient'

export async function fetchPublicDocuments(search = '') {
  let query = supabase.from('documents').select('*').eq('is_public', true)
  if (search.trim()) {
    query = query.textSearch('search_vector', search, { type: 'websearch', config: 'simple' })
  }
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchAllDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
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

export async function getDocumentSignedUrl(path) {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}
