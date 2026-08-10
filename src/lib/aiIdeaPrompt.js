import { MINI_GAME_CATEGORIES } from '@/lib/miniGameTaxonomy'

// Số ý tưởng AI trả về mỗi lần tạo prompt (cố định theo yêu cầu, không cho chỉnh)
export const IDEAS_PER_REQUEST = 5

const CATEGORY_KEYS = Object.keys(MINI_GAME_CATEGORIES)

/**
 * Sinh đoạn prompt tiếng Việt để dán vào bất kỳ khung chat AI nào (Claude, ChatGPT...).
 * AI được yêu cầu trả về JSON thuần theo schema cố định để tool có thể parse lại.
 */
export function buildIdeaPrompt(criteria) {
  const {
    category = '',
    subject = '',
    studentCount = '',
    duration = '',
    energyLevel = '',
    notes = '',
  } = criteria

  const categoryLabel = category ? MINI_GAME_CATEGORIES[category]?.label : ''
  const categoryListText = CATEGORY_KEYS
    .map((key) => `"${key}" (${MINI_GAME_CATEGORIES[key].label})`)
    .join(', ')

  const contextLines = [
    categoryLabel && `- Loại hoạt động mong muốn: ${categoryLabel}`,
    subject && `- Môn học / chủ đề bài học: ${subject}`,
    studentCount && `- Số lượng học sinh: ${studentCount}`,
    duration && `- Thời gian dự kiến: ${duration}`,
    energyLevel && `- Mức độ sôi động mong muốn: ${energyLevel}`,
    notes && `- Ghi chú thêm: ${notes}`,
  ].filter(Boolean)

  return `Bạn là chuyên gia thiết kế hoạt động dạy học sáng tạo, hiểu tâm lý học sinh cấp 2. Hãy đề xuất ${IDEAS_PER_REQUEST} ý tưởng mini game / hoạt động tương tác hấp dẫn để hỗ trợ một giáo viên giảng dạy trên lớp.

Bối cảnh:
${contextLines.length ? contextLines.join('\n') : '- (Không có tiêu chí cụ thể, hãy đề xuất đa dạng)'}

Yêu cầu quan trọng:
1. Mỗi ý tưởng phải có cách chơi/thực hiện CỤ THỂ, đủ chi tiết để một giáo viên đọc xong là làm được ngay, không cần hỏi lại.
2. Trường "category" BẮT BUỘC chỉ được chọn đúng 1 trong các giá trị sau (viết chính xác key, không dịch): ${categoryListText}.
3. CHỈ trả lời bằng một khối JSON THUẦN (không markdown, không \`\`\`, không giải thích thêm trước/sau), đúng định dạng mảng dưới đây:

[
  {
    "title": "Tên ý tưởng ngắn gọn, hấp dẫn",
    "description": "Mô tả cách chơi/thực hiện từng bước cụ thể",
    "category": "một trong các key ở trên",
    "duration_minutes": 5,
    "materials": "Vật liệu/chuẩn bị cần thiết, để trống nếu không cần gì đặc biệt",
    "tags": ["từ khoá 1", "từ khoá 2"]
  }
]

Trả về đúng ${IDEAS_PER_REQUEST} phần tử trong mảng.`
}

/**
 * Cố gắng trích xuất và parse JSON từ nội dung AI trả về, kể cả khi AI lỡ
 * kèm markdown code fence hoặc vài dòng giải thích thừa trước/sau khối JSON.
 * Ném lỗi với thông báo tiếng Việt rõ ràng nếu không thể parse được.
 */
export function parseIdeaJson(rawText) {
  const text = (rawText ?? '').trim()
  if (!text) {
    throw new Error('Chưa dán nội dung nào. Hãy dán kết quả JSON mà AI trả về vào ô bên trên.')
  }

  const candidates = []

  // 1. Thử parse trực tiếp
  candidates.push(text)

  // 2. Bỏ code fence dạng ```json ... ``` hoặc ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) candidates.push(fenceMatch[1].trim())

  // 3. Cắt từ dấu [ đầu tiên tới dấu ] cuối cùng (bỏ text thừa quanh mảng)
  const firstBracket = text.indexOf('[')
  const lastBracket = text.lastIndexOf(']')
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    candidates.push(text.slice(firstBracket, lastBracket + 1))
  }

  let parsed = null
  for (const candidate of candidates) {
    try {
      parsed = JSON.parse(candidate)
      break
    } catch {
      // thử candidate tiếp theo
    }
  }

  if (parsed === null) {
    throw new Error(
      'Không đọc được JSON. Kiểm tra lại: đã copy đủ toàn bộ nội dung AI trả về chưa, có bị thiếu dấu ] hoặc } ở cuối không.'
    )
  }

  // Cho phép AI lỡ trả về 1 object đơn thay vì mảng
  const list = Array.isArray(parsed) ? parsed : [parsed]

  if (list.length === 0) {
    throw new Error('JSON hợp lệ nhưng không có ý tưởng nào trong danh sách.')
  }

  return list.map((item, index) => normalizeIdea(item, index))
}

function normalizeIdea(item, index) {
  if (!item || typeof item !== 'object') {
    throw new Error(`Phần tử thứ ${index + 1} trong JSON không phải là một object hợp lệ.`)
  }
  const title = String(item.title ?? '').trim()
  if (!title) {
    throw new Error(`Ý tưởng thứ ${index + 1} thiếu trường "title".`)
  }
  const category = CATEGORY_KEYS.includes(item.category) ? item.category : 'other'
  const tags = Array.isArray(item.tags)
    ? item.tags.map((t) => String(t).trim()).filter(Boolean)
    : []
  const description = String(item.description ?? '').trim()
  const materials = String(item.materials ?? '').trim()
  const durationMinutes = item.duration_minutes != null && item.duration_minutes !== ''
    ? Number(item.duration_minutes)
    : null

  return {
    title,
    description,
    category,
    tags,
    materials,
    durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
  }
}

/**
 * Gộp description + thời gian + vật liệu thành 1 đoạn mô tả hoàn chỉnh
 * để lưu vào cột `description` của bảng mini_games (bảng không có cột riêng
 * cho thời gian/vật liệu).
 */
export function ideaToDescription(idea) {
  const parts = [idea.description]
  if (idea.durationMinutes) parts.push(`⏱ Thời gian gợi ý: ${idea.durationMinutes} phút`)
  if (idea.materials) parts.push(`🧰 Chuẩn bị: ${idea.materials}`)
  return parts.filter(Boolean).join('\n\n')
}
