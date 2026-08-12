import { Feather, Star, Compass, Coffee, FileText, Clapperboard } from 'lucide-react'

export const ENTERTAINMENT_CATEGORIES = [
  {
    key: 'song_ngam',
    label: 'Sống & Suy Ngẫm',
    icon: Feather,
    accent: 'sky',
    subtitle: 'Những trang viết chậm lại, để nhìn cuộc sống rõ hơn.',
    intro: 'Tuyển tập bài viết và những suy ngẫm về đời sống thường ngày — nơi bạn dừng lại một chút giữa những bận rộn.',
  },
  {
    key: 'cau_chuyen_cam_hung',
    label: 'Câu Chuyện Cảm Hứng',
    icon: Star,
    accent: 'amber',
    subtitle: 'Những câu chuyện có thật, chạm đến cảm xúc.',
    intro: 'Hành trình của những con người đã đi qua khó khăn để trưởng thành — đọc để được tiếp thêm động lực.',
  },
  {
    key: 'goc_nhin_da_chieu',
    label: 'Góc Nhìn Đa Chiều',
    icon: Compass,
    accent: 'violet',
    subtitle: 'Một vấn đề, nhiều lăng kính khác nhau.',
    intro: 'Những bài viết đặt câu hỏi, phản biện, và mở ra góc nhìn khác cho những điều tưởng như hiển nhiên.',
  },
  {
    key: 'tram_thu_gian',
    label: 'Trạm Thư Giãn',
    icon: Coffee,
    accent: 'emerald',
    subtitle: 'Dừng chân, hít thở, và thư giãn một chút.',
    intro: 'Nơi lưu lại những mẩu chuyện nhẹ nhàng, hình ảnh và video giúp đầu óc được nghỉ ngơi.',
  },
]

export const CONTENT_TYPES = [
  { key: 'article', label: 'Bài viết', icon: FileText },
  { key: 'media', label: 'Video & Hình ảnh', icon: Clapperboard },
]

export function getCategory(key) {
  return ENTERTAINMENT_CATEGORIES.find((c) => c.key === key) ?? null
}

export function getContentType(key) {
  return CONTENT_TYPES.find((t) => t.key === key) ?? null
}
