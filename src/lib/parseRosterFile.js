import readXlsxFile from 'read-excel-file/browser'

function parseDelimitedText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.split(',')[0]?.trim())
    .filter(Boolean)
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Tra ve mang ten hoc sinh tu file .xlsx/.xls hoac .csv/.txt.
// Lay cot dau tien cua moi dong, bo dong trong. Dong dau (neu la tieu de
// dang "STT"/"Tên"/...) van duoc giu lai de GV tu ra soat/xoa trong buoc xem lai.
export async function parseRosterFile(file) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const rows = await readXlsxFile(file)
    return rows.map((row) => String(row[0] ?? '').trim()).filter(Boolean)
  }
  const text = await readFileAsText(file)
  return parseDelimitedText(text)
}
