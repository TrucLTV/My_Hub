import { unzipSync } from 'fflate'

// Bung file zip ngay trong trình duyệt, gộp phẳng mọi thư mục con (chỉ giữ tên file).
export async function extractZipEntries(zipFile) {
  const buffer = await zipFile.arrayBuffer()
  const unzipped = unzipSync(new Uint8Array(buffer))

  const entries = []
  for (const [path, data] of Object.entries(unzipped)) {
    if (path.endsWith('/')) continue
    if (path.includes('__MACOSX/')) continue
    const name = path.split('/').pop()
    if (!name || name.startsWith('.')) continue
    entries.push({ name, file: new File([data], name) })
  }
  return entries
}
