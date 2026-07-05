import { supabase } from '@/lib/supabaseClient'

export async function fetchRosters() {
  const { data, error } = await supabase.from('student_rosters').select('*').order('name')
  if (error) throw error
  return data
}

export async function createRoster(roster) {
  const { data, error } = await supabase.from('student_rosters').insert(roster).select().single()
  if (error) throw error
  return data
}

export async function updateRoster(id, updates) {
  const { data, error } = await supabase
    .from('student_rosters')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRoster(id) {
  const { error } = await supabase.from('student_rosters').delete().eq('id', id)
  if (error) throw error
}
