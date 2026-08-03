import { supabase } from '@/lib/supabaseClient'

export async function fetchPublicResources() {
  const { data, error } = await supabase
    .from('resources_public_view')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchAllResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createResource(resource) {
  const { data, error } = await supabase.from('resources').insert(resource).select().single()
  if (error) throw error
  return data
}

export async function updateResource(id, updates) {
  const { data, error } = await supabase
    .from('resources')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteResource(id) {
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) throw error
}

export async function unlockResourceUrl(id, password) {
  const { data, error } = await supabase.rpc('get_locked_resource_url', { p_id: id, p_password: password })
  if (error) throw error
  return data
}
