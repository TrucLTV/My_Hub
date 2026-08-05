import { BLOOM_LABELS } from '@/lib/resourceTaxonomy'
import { parseQuizData, replaceQuizData } from '@/lib/quizParser'

// Cau "Keo tha" can tuong tac keo/tha that su tren man hinh — khong the hien
// duoc tren giay/PDF/Word, nen loai khoi danh sach ung vien cho ban de in tinh
// (ma tran + thu cong). Ban tuong tac (mo tren may) van dung duoc binh thuong.
export function isPrintable(q) {
  return q.type !== 'dragdrop'
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Chon ngau nhien du so luong cau theo tung muc do (ma tran). Tra ve ca danh
// sach cau da chon lan canh bao neu thieu (khong du cau cho 1 muc do nao do).
export function sampleByMatrix(candidates, matrixCounts) {
  const selected = []
  const warnings = []
  for (const [bloom, count] of Object.entries(matrixCounts)) {
    const n = Number(count) || 0
    if (n <= 0) continue
    const pool = shuffle(candidates.filter((q) => q.bloom === bloom))
    if (pool.length < n) {
      warnings.push(`${BLOOM_LABELS[bloom] ?? bloom}: cần ${n} câu nhưng chỉ có ${pool.length} câu phù hợp.`)
    }
    selected.push(...pool.slice(0, n))
  }
  return { selected, warnings }
}

// Cat bo cac field chi phuc vu duyet/loc (id, resourceId, subject...), giu
// dung shape cau hoi nhu file .html goc dang dung (toExportQuestion trong tool
// soan) — can shape nay de nhung vao QUIZ_DATA khi xuat ban tuong tac.
export function toPlainQuestion(q) {
  // eslint-disable-next-line no-unused-vars
  const { id, resourceId, resourceTitle, resourceUrl, questionIndex, subject, grade_level, topic, lesson, ...rest } = q
  return rest
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

// Noi dung phan cau hoi (dung chung cho ca de HS va dap an) — showAnswers=true
// se to dam + ghi ro dap an dung ngay duoi moi cau, dung cho ban danh cho GV.
function renderQuestionHtml(q, index, showAnswers) {
  const parts = [`<div class="q"><p class="q-head"><strong>Câu ${index + 1}.</strong> `]

  if (q.type === 'fillblank') {
    const filled = (q.textWithBlanks ?? '').split('___').map((seg, i, arr) => {
      const blank = i < arr.length - 1
        ? (showAnswers
          ? `<u>${escapeHtml(q.answers?.[i]?.[0] ?? '…')}</u>`
          : '.'.repeat(12))
        : ''
      return escapeHtml(seg) + blank
    })
    parts.push(filled.join(''), '</p></div>')
    return parts.join('')
  }

  parts.push(escapeHtml(q.question), '</p>')

  if (q.type === 'single' || q.type === 'multi') {
    const correct = q.type === 'single' ? [q.correctIndex] : (q.correctIndexes ?? [])
    parts.push('<div class="q-options">')
    q.options.forEach((opt, i) => {
      const mark = showAnswers && correct.includes(i) ? ' class="correct"' : ''
      parts.push(`<div${mark}>${LETTERS[i] ?? i + 1}. ${escapeHtml(opt)}</div>`)
    })
    parts.push('</div>')
  } else if (q.type === 'order') {
    if (showAnswers) {
      parts.push('<ol>', q.items.map((it) => `<li>${escapeHtml(it)}</li>`).join(''), '</ol>')
    } else {
      parts.push('<p class="q-hint">(Đánh số thứ tự đúng vào ô trống trước mỗi mục)</p><div class="q-options">')
      shuffle(q.items).forEach((it) => parts.push(`<div>&#9633;&nbsp; ${escapeHtml(it)}</div>`))
      parts.push('</div>')
    }
  } else if (q.type === 'match') {
    parts.push('<div class="q-match"><div>')
    q.colA.forEach((a, i) => parts.push(`<div>${i + 1}. ${escapeHtml(a.text)}</div>`))
    parts.push('</div><div>')
    const bList = showAnswers ? q.colB : shuffle(q.colB)
    bList.forEach((b) => parts.push(`<div>${LETTERS[q.colB.indexOf(b)] ?? ''}. ${escapeHtml(b.text)}</div>`))
    parts.push('</div></div>')
    if (showAnswers) {
      const pairs = q.pairs.map((p) => {
        const aIdx = q.colA.findIndex((x) => x.id === p.a)
        const bIdx = q.colB.findIndex((x) => x.id === p.b)
        return `${aIdx + 1}-${LETTERS[bIdx] ?? ''}`
      })
      parts.push(`<p class="q-answer">Đáp án nối: ${pairs.join(', ')}</p>`)
    }
  }

  parts.push('</div>')
  return parts.join('')
}

const EXAM_CSS = `
*{box-sizing:border-box}
body{font-family:'Times New Roman',Georgia,serif;color:#111;max-width:800px;margin:0 auto;padding:24px 28px;line-height:1.5}
.exam-header{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px}
.exam-header .left,.exam-header .right{font-size:14px}
.exam-title{text-align:center;font-size:20px;font-weight:700;margin:10px 0 4px;text-transform:uppercase}
.exam-sub{text-align:center;font-size:14px;margin-bottom:18px}
.exam-info{display:flex;flex-wrap:wrap;gap:6px 24px;font-size:14px;margin-bottom:18px}
.q{margin-bottom:14px}
.q-head{margin:0 0 4px}
.q-options{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-left:18px}
.q-options .correct{font-weight:700;color:#15803d}
.q-hint{margin:2px 0 4px;font-style:italic;color:#555;font-size:13px}
.q-match{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-left:18px}
.q-answer{margin:4px 0 0 18px;font-weight:700;color:#15803d}
.answer-table{border-collapse:collapse;margin-top:8px}
.answer-table td,.answer-table th{border:1px solid #999;padding:4px 10px;text-align:center;font-size:14px}
.print-actions{margin:18px 0;display:flex;gap:10px}
.print-actions button{font-family:inherit;font-size:14px;padding:8px 14px;border-radius:6px;border:1px solid #888;background:#f4f4f5;cursor:pointer}
@media print{.print-actions{display:none}body{padding:0}}
`

// Dung chung: cau hoi -> phan "BANG DAP AN" gon o cuoi ban dap an (thay vi to
// dam tung cau, de GV doi chieu nhanh khi cham).
function renderAnswerTable(questions) {
  const rows = questions.map((q, i) => {
    if (q.type === 'single') return `${i + 1}: ${LETTERS[q.correctIndex] ?? ''}`
    if (q.type === 'multi') return `${i + 1}: ${(q.correctIndexes ?? []).map((idx) => LETTERS[idx]).join(', ')}`
    if (q.type === 'order') return `${i + 1}: ${q.items.map((_, idx) => idx + 1).join('-')}`
    if (q.type === 'match') {
      const pairs = q.pairs.map((p) => {
        const aIdx = q.colA.findIndex((x) => x.id === p.a)
        const bIdx = q.colB.findIndex((x) => x.id === p.b)
        return `${aIdx + 1}-${LETTERS[bIdx] ?? ''}`
      })
      return `${i + 1}: ${pairs.join(', ')}`
    }
    if (q.type === 'fillblank') return `${i + 1}: ${(q.answers ?? []).map((a) => a[0] ?? '').join(' / ')}`
    return `${i + 1}: —`
  })
  return `<table class="answer-table"><tbody><tr>${rows.map((r) => `<td>${escapeHtml(r)}</td>`).join('')}</tr></tbody></table>`
}

// Xuat ban de tinh (in giay) — showAnswers=false cho HS, true cho GV (co dap an).
export function buildStaticExamHtml({ title, subjectLabel, gradeLabel, duration, questions, showAnswers }) {
  const body = questions.map((q, i) => renderQuestionHtml(q, i, showAnswers)).join('\n')
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}${showAnswers ? ' - Đáp án' : ''}</title>
<style>${EXAM_CSS}</style>
</head>
<body>
<div class="print-actions"><button onclick="window.print()">In / Lưu PDF</button></div>
<div class="exam-header">
  <div class="left">TRƯỜNG: .....................................<br>Họ và tên: .....................................<br>Lớp: ..................</div>
  <div class="right">Môn: ${escapeHtml(subjectLabel ?? '')}${gradeLabel ? ' — ' + escapeHtml(gradeLabel) : ''}<br>Thời gian: ${duration ? escapeHtml(String(duration)) + ' phút' : '...................'}<br>Điểm: ..................</div>
</div>
<p class="exam-title">${escapeHtml(title)}${showAnswers ? ' — ĐÁP ÁN' : ''}</p>
${body}
${showAnswers ? '<p class="q-head" style="margin-top:20px"><strong>Bảng đáp án tóm tắt</strong></p>' + renderAnswerTable(questions) : ''}
</body>
</html>`
}

export function downloadHtml(filename, html) {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function printHtml(html) {
  const win = window.open('', '_blank')
  if (!win) throw new Error('Trình duyệt chặn cửa sổ mới — cho phép popup rồi thử lại.')
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.onload = () => win.print()
}

// Xuat ban tuong tac: nhung QUIZ_DATA moi vao 1 file de co san lam khuon (tai
// tu 1 resource dang co trong ngan hang), giu nguyen toan bo engine CSS/JS cua
// tool soan — khong can port lai engine qua MyHub.
export async function buildInteractiveExamHtml(templateUrl, { title, questions }) {
  const res = await fetch(`${templateUrl}?t=${Date.now()}`)
  if (!res.ok) throw new Error(`Không tải được khuôn đề (${res.status})`)
  const html = await res.text()
  const template = parseQuizData(html)
  if (!template) throw new Error('Không đọc được khuôn đề tương tác.')
  const data = {
    title,
    scoringEnabled: true,
    grade: template.grade ?? '',
    topic: '',
    lesson: '',
    questions,
  }
  return replaceQuizData(html, data)
}
