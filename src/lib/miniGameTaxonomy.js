import { Dices, HelpCircle, Trophy, Timer, FolderKanban } from 'lucide-react'

export const MINI_GAME_CATEGORIES = {
  random_picker: { label: 'Gọi tên ngẫu nhiên', icon: Dices },
  quiz: { label: 'Đố vui / Quiz', icon: HelpCircle },
  team_competition: { label: 'Thi đua nhóm', icon: Trophy },
  timer: { label: 'Đồng hồ đếm giờ', icon: Timer },
  other: { label: 'Khác', icon: FolderKanban },
}

export const DELIVERY_TYPES = {
  web_tool: { label: 'Chạy trên web' },
  downloadable: { label: 'Tải về' },
  external_link: { label: 'Link ngoài' },
}
