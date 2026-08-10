import LottoPicker from '@/components/miniGameTools/LottoPicker'
import BeeRace from '@/components/miniGameTools/BeeRace'
import FlySwatter from '@/components/miniGameTools/FlySwatter'
import TeamRace from '@/components/miniGameTools/TeamRace'
import TeamBalloon from '@/components/miniGameTools/TeamBalloon'
import TeamTower from '@/components/miniGameTools/TeamTower'
import CardDraw from '@/components/miniGameTools/CardDraw'
import AnimalRace from '@/components/miniGameTools/AnimalRace'

// Giai đoạn 2: mỗi khi lập trình xong 1 công cụ tương tác thật, đăng ký vào đây.
// key phải khớp với giá trị tool_key được chọn trong Admin.
export const MINI_GAME_TOOLS = {
  lotto_picker: { label: 'Quay lô tô (gọi tên cá nhân)', component: LottoPicker },
  bee_race: { label: 'Ong bay về hoa (gọi tên cá nhân)', component: BeeRace },
  fly_swatter: { label: 'Đập ruồi (chia nhóm)', component: FlySwatter },
  team_race: { label: 'Đua xe (thi đua nhóm)', component: TeamRace },
  team_balloon: { label: 'Khinh khí cầu (thi đua nhóm)', component: TeamBalloon },
  team_tower: { label: 'Xây tháp (thi đua nhóm)', component: TeamTower },
  card_draw: { label: 'Rút thăm bốc thẻ (gọi tên cá nhân)', component: CardDraw },
  animal_race: { label: 'Đua thú (gọi tên cá nhân)', component: AnimalRace },
}
