// Bụi tre trang trí — cổng lại từ bộ SVG tre chi tiết (đốt tre thật + cụm lá) của
// bản mẫu ebook gốc, dùng làm dải trang trí dọc chạy suốt trang đọc thay cho
// hoạ tiết đơn giản trước đây. Thuần trang trí — luôn aria-hidden.
const LEAF_PATH = 'M0 0Q-26-11-50-52Q-19-28 0 0Z'
const ACCENT_2 = '#a9834a' // điểm nhấn vàng đất trên vài chiếc lá, tách khỏi currentColor

function BambooDefs() {
  return (
    <defs>
      <path id="bambooLeaf" d={LEAF_PATH} />
      <g id="bambooGround">
        <path d="M-6 831c1-9 3-9 4 0M0 831c1-11 3-11 4 0M6 831c1-9 3-9 4 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="-10" cy="833" r="2.4" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="9" cy="836" r="1.8" fill="none" stroke="currentColor" strokeWidth="1" />
      </g>

      {/* thân tre cao: cong và nghiêng dần khi vươn lên, gốc trơ trụi, ngọn rậm lá */}
      <g id="caneTall">
        <path d="M0 828C4 600 34 300 70 30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="11" cy="700" rx="2.6" ry="4.2" fill="none" stroke="currentColor" strokeWidth="1.1" transform="rotate(-11 11 700)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(11 700) rotate(-30) scale(0.55)" />
        <ellipse cx="24" cy="560" rx="2.6" ry="4.2" fill="none" stroke="currentColor" strokeWidth="1.1" transform="rotate(-24 24 560)" />
        <use href="#bambooLeaf" fill={ACCENT_2} transform="translate(24 560) rotate(24) scale(0.6)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(24 560) rotate(-56) scale(0.5)" />
        <ellipse cx="36" cy="420" rx="2.6" ry="4.2" fill="none" stroke="currentColor" strokeWidth="1.1" transform="rotate(-34 36 420)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(36 420) rotate(-14) scale(0.65)" />
        <ellipse cx="48" cy="280" rx="2.6" ry="4.2" fill="none" stroke="currentColor" strokeWidth="1.1" transform="rotate(-42 48 280)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(48 280) rotate(10) scale(0.85)" />
        <use href="#bambooLeaf" fill={ACCENT_2} transform="translate(48 280) rotate(-46) scale(0.75)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(59 155) rotate(2) scale(1)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(59 155) rotate(-52) scale(0.9)" />
        <use href="#bambooLeaf" fill={ACCENT_2} transform="translate(59 155) rotate(46) scale(0.8)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(70 30) rotate(20) scale(1.15)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(70 30) rotate(-24) scale(1.05)" />
        <use href="#bambooLeaf" fill={ACCENT_2} transform="translate(70 30) rotate(58) scale(0.9)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(70 30) rotate(-64) scale(0.85)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(70 30) rotate(84) scale(0.75)" />
        <use href="#bambooLeaf" fill={ACCENT_2} transform="translate(70 30) rotate(-90) scale(0.7)" />
        <use href="#bambooGround" />
      </g>

      {/* thân tre trung */}
      <g id="caneMid">
        <path d="M0 828C3 660 22 380 45 220" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="10" cy="600" rx="2.3" ry="3.6" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(-9 10 600)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(10 600) rotate(-26) scale(0.5)" />
        <ellipse cx="22" cy="470" rx="2.3" ry="3.6" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(-22 22 470)" />
        <use href="#bambooLeaf" fill={ACCENT_2} transform="translate(22 470) rotate(20) scale(0.55)" />
        <ellipse cx="33" cy="340" rx="2.3" ry="3.6" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(-32 33 340)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(33 340) rotate(8) scale(0.75)" />
        <use href="#bambooLeaf" fill={ACCENT_2} transform="translate(33 340) rotate(-44) scale(0.65)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(45 220) rotate(16) scale(1)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(45 220) rotate(-30) scale(0.85)" />
        <use href="#bambooLeaf" fill={ACCENT_2} transform="translate(45 220) rotate(56) scale(0.75)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(45 220) rotate(-68) scale(0.65)" />
        <use href="#bambooGround" />
      </g>

      {/* măng non, thân ngắn */}
      <g id="caneShort">
        <path d="M0 828C2 740 12 540 25 440" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <ellipse cx="8" cy="650" rx="2" ry="3" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(-8 8 650)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(8 650) rotate(-24) scale(0.45)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(25 440) rotate(10) scale(0.75)" />
        <use href="#bambooLeaf" fill="currentColor" transform="translate(25 440) rotate(-36) scale(0.6)" />
        <use href="#bambooLeaf" fill={ACCENT_2} transform="translate(25 440) rotate(46) scale(0.55)" />
        <use href="#bambooGround" />
      </g>
    </defs>
  )
}

// Dải tre hoàn chỉnh — nhiều thân ghép/lật để trông rậm rạp hơn, kéo dài hết
// chiều cao vùng chứa (dùng cho cột trang trí giữa mục lục và nội dung đọc).
export default function BambooRail({ className = '' }) {
  return (
    <svg
      viewBox="0 0 120 900"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{ overflow: 'visible' }}
    >
      <BambooDefs />
      <use href="#caneShort" transform="translate(26 0) scale(-1,1)" />
      <use href="#caneTall" transform="translate(30 0)" />
      <use href="#caneMid" transform="translate(48 14) scale(-1,1)" />
      <use href="#caneTall" transform="translate(50 -8) scale(0.82)" />
      <use href="#caneShort" transform="translate(78 0)" />
      <use href="#caneMid" transform="translate(70 10)" />
    </svg>
  )
}
