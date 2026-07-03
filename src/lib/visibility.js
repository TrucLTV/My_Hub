export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Công khai — ai cũng xem/tải được' },
  { value: 'locked', label: 'Khóa tải — ai cũng xem, cần mật khẩu để tải/xem chi tiết' },
  { value: 'private', label: 'Ẩn hoàn toàn — chỉ admin thấy' },
]

export function visibilityToFields(visibility) {
  if (visibility === 'public') return { is_public: true, is_locked: false }
  if (visibility === 'locked') return { is_public: false, is_locked: true }
  return { is_public: false, is_locked: false }
}

export function fieldsToVisibility(row) {
  if (row.is_public) return 'public'
  if (row.is_locked) return 'locked'
  return 'private'
}
