import { supabase } from '@/lib/supabaseClient'
import { toPrefixQuery } from '@/lib/textSearch'
import { watermarkOoxmlBytes, hasWatermark, isWatermarkableExtension } from '@/lib/docxWatermark'

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

async function withWatermarkIfApplicable(file) {
  if (!isWatermarkableExtension(file.name)) return file
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const watermarked = watermarkOoxmlBytes(bytes)
    return new File([watermarked], file.name, { type: file.type })
  } catch (err) {
    console.warn('Không nhúng được watermark, tải file gốc:', err)
    return file
  }
}

export async function uploadDocumentFile(file) {
  const fileToUpload = await withWatermarkIfApplicable(file)
  const path = `${crypto.randomUUID()}-${toSafeStorageName(fileToUpload.name)}`
  const { error } = await supabase.storage.from('documents').upload(path, fileToUpload)
  if (error) throw error
  return path
}

// Nhúng lại watermark cho các file .docx/.xlsx/.pptx công khai đã tải lên từ trước.
// Chạy trong phiên đăng nhập admin (cần quyền ghi Storage qua RLS).
export async function watermarkExistingPublicDocuments(onProgress, concurrency = 4) {
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, file_url, file_type')
    .eq('is_public', true)
    .in('file_type', ['docx', 'xlsx', 'pptx'])
  if (error) throw error

  const results = { total: docs.length, done: 0, skipped: 0, failed: 0 }
  let index = 0

  async function worker() {
    while (index < docs.length) {
      const doc = docs[index++]
      try {
        const { data: blob, error: downloadError } = await supabase.storage.from('documents').download(doc.file_url)
        if (downloadError) throw downloadError
        const bytes = new Uint8Array(await blob.arrayBuffer())
        if (hasWatermark(bytes)) {
          results.skipped++
        } else {
          const watermarked = watermarkOoxmlBytes(bytes)
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(doc.file_url, new Blob([watermarked], { type: blob.type }), { upsert: true })
          if (uploadError) throw uploadError
          results.done++
        }
      } catch (err) {
        console.error(`Lỗi nhúng watermark cho tài liệu ${doc.id}:`, err)
        results.failed++
      }
      onProgress?.({ ...results })
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, docs.length) || 1 }, () => worker()))
  return results
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
