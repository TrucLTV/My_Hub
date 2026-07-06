import LottoPicker from '@/components/miniGameTools/LottoPicker'
import BeeRace from '@/components/miniGameTools/BeeRace'
import FlySwatter from '@/components/miniGameTools/FlySwatter'

// Giai đoạn 2: mỗi khi lập trình xong 1 công cụ tương tác thật, đăng ký vào đây.
// key phải khớp với giá trị tool_key được chọn trong Admin.
export const MINI_GAME_TOOLS = {
  lotto_picker: { label: 'Quay lô tô (gọi tên cá nhân)', component: LottoPicker },
  bee_race: { label: 'Ong bay về hoa (gọi tên cá nhân)', component: BeeRace },
  fly_swatter: { label: 'Đập ruồi (chia nhóm)', component: FlySwatter },
}
