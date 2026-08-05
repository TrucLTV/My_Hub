// File .html tu-luu trong bucket "resource_files" (vd de trac nghiem gui tu tool
// ngoai) dang bi Supabase Storage phuc vu sai Content-Type (luon la text/plain
// du metadata da dung — loi phia Supabase, da xac minh qua API), khien trinh
// duyet khong chiu render ma hien nguyen ma. Voi rieng loai file nay, ta tu
// fetch noi dung roi mo bang Blob co khai bao dung "text/html" — bo qua hoan
// toan header sai tu server, khong can Supabase sua gi ca. Dung chung cho ca
// trang public (ResourcesPublic) va trang admin (AdminResources).
export const RESOURCE_FILES_PREFIX = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/resource_files/`

export function isSelfHostedHtml(url) {
  return typeof url === 'string' && url.startsWith(RESOURCE_FILES_PREFIX) && url.toLowerCase().endsWith('.html')
}

// Duong dan luu tru (bucket-relative) tu 1 public URL — dung khi can ghi de lai
// dung file do (sua/xoa cau hoi ben trong).
export function storagePathFromUrl(url) {
  return isSelfHostedHtml(url) ? url.slice(RESOURCE_FILES_PREFIX.length) : null
}

export async function openSelfHostedHtml(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Không tải được file (${res.status})`)
  const text = await res.text()
  const blobUrl = URL.createObjectURL(new Blob([text], { type: 'text/html' }))
  window.open(blobUrl, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}
