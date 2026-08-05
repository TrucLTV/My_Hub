import { RESOURCE_SUBJECTS, RESOURCE_GRADES } from '@/lib/resourceTaxonomy'

// Doc du lieu tung cau hoi tu file .html do tool "Trac nghiem tuong tac"
// (D:/projects/CPP-EDU-HUB) xuat ra. Tool nhung san 1 bien JS "QUIZ_DATA"
// (JSON.stringify, khong xuong dong) ngay dau <script>, xem buildQuizHTML()
// trong trac-nghiem-tuong-tac.html — vi du:
//   <script>var QUIZ_DATA = {"title":"...","questions":[...]};ENGINE_JS...</script>
// JSON.stringify khong sinh ky tu xuong dong that nao trong chuoi, nen ";\n"
// dau tien sau "var QUIZ_DATA = " chac chan la diem ket thuc khoi JSON.
const QUIZ_DATA_RE = /var QUIZ_DATA = ([\s\S]*?);\n/

export function parseQuizData(html) {
  const match = html.match(QUIZ_DATA_RE)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

// Tool gui-tu-dong dang co bug ghi tag la "Khối khoi_6" (nhet ca prefix "khoi_"
// vao thay vi chi so 6) thay vi "Khối 6" — chap nhan ca 2 dang cho chac.
const GRADE_TAG_RE = /^Khối\s+(?:khoi_)?(\d+)$/i

// Tool gui-thang chi nhet Mon/Khoi vao mang tags (chua co cot subject/grade_level
// rieng khi gui tu dong) — doan nay doan lai tu tags de van loc duoc theo Mon/Khoi
// ma khong bat GV phai gui lai hay sua tay tung tai nguyen cu.
export function subjectFromTags(tags) {
  if (!tags) return null
  for (const [key, node] of Object.entries(RESOURCE_SUBJECTS)) {
    if (tags.includes(node.label)) return key
  }
  return null
}

export function gradeFromTags(tags) {
  if (!tags) return null
  for (const tag of tags) {
    const m = tag.match(GRADE_TAG_RE)
    if (m && RESOURCE_GRADES[`khoi_${m[1]}`]) return `khoi_${m[1]}`
  }
  return null
}
