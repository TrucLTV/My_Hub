import { supabase } from '@/lib/supabaseClient'
import { isSelfHostedHtml, storagePathFromUrl } from '@/lib/openSelfHostedHtml'
import { parseQuizData, replaceQuizData, subjectFromTags, gradeFromTags } from '@/lib/quizParser'

// Mon/Khoi cua 1 resource: uu tien cot rieng (nhap tay qua Admin), fallback doc
// tu tags (cach duy nhat tool gui-tu-dong dang ghi Mon/Khoi vao).
export function classifyResource(resource) {
  return {
    subject: resource.subject || subjectFromTags(resource.tags),
    grade_level: resource.grade_level || gradeFromTags(resource.tags),
  }
}

// Tai + parse tung file de tu-luu (bo qua resource dang khoa chua mo, hoac link
// ngoai khong phai file cua tool) de gop toan bo cau hoi ben trong lai thanh 1
// kho duyet chung — thay vi bat GV/admin mo tung de.
export async function fetchQuestionPool(resources) {
  const candidates = resources.filter((r) => isSelfHostedHtml(r.url))
  const parsedEntries = await Promise.all(
    candidates.map(async (resource) => {
      try {
        // Bucket nay tung bi Cloudflare cache sai o edge (xem openSelfHostedHtml.js)
        // — luon fetch fresh de khong hien du lieu cu sau khi sua/xoa cau hoi.
        const res = await fetch(`${resource.url}?t=${Date.now()}`)
        if (!res.ok) return null
        const data = parseQuizData(await res.text())
        if (!data?.questions?.length) return null
        return { resource, data }
      } catch {
        return null
      }
    })
  )

  const questions = []
  const parsedIds = new Set()
  for (const entry of parsedEntries) {
    if (!entry) continue
    const { resource, data } = entry
    parsedIds.add(resource.id)
    const { subject, grade_level } = classifyResource(resource)
    const topic = data.topic || resource.topic || null
    const lesson = data.lesson || resource.lesson || null
    data.questions.forEach((q, i) => {
      questions.push({
        ...q,
        id: `${resource.id}-${i}`,
        resourceId: resource.id,
        resourceTitle: resource.title,
        resourceUrl: resource.url,
        questionIndex: i,
        subject,
        grade_level,
        topic,
        lesson,
      })
    })
  }
  return { questions, parsedIds }
}

// Tai lai file .html cua 1 resource, doi mang cau hoi (sua hoac xoa 1 cau), ghi
// de lai dung file do tren storage — du lieu cau hoi van nam trong file tu tool
// soan (khong co bang rieng), nen "sua" nghia la sua-tai-cho trong chinh file do.
async function mutateResourceQuestions(resource, mutate) {
  const res = await fetch(`${resource.url}?t=${Date.now()}`)
  if (!res.ok) throw new Error(`Không tải được đề (${res.status})`)
  const html = await res.text()
  const data = parseQuizData(html)
  if (!data) throw new Error('Không đọc được dữ liệu câu hỏi trong file này.')

  data.questions = mutate(data.questions)

  const path = storagePathFromUrl(resource.url)
  if (!path) throw new Error('Không xác định được đường dẫn lưu trữ của file.')

  const { error } = await supabase.storage
    .from('resource_files')
    .upload(path, replaceQuizData(html, data), { contentType: 'text/html', upsert: true })
  if (error) throw error
}

export async function updateQuestionInResource(resource, questionIndex, newQuestion) {
  await mutateResourceQuestions(resource, (questions) =>
    questions.map((q, i) => (i === questionIndex ? newQuestion : q))
  )
}

export async function deleteQuestionFromResource(resource, questionIndex) {
  await mutateResourceQuestions(resource, (questions) => questions.filter((_, i) => i !== questionIndex))
}
