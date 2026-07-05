// Khung trang trí mô phỏng lồng quay lô tô (tham khảo hình lồng quay cổ điển:
// khung dây hình cầu + chân đế + tay quay). Chỉ vẽ khung — bóng số được vẽ
// riêng đè lên trên bởi LottoPicker để có thể animate độc lập.
export default function LottoCageFrame() {
  return (
    <svg viewBox="0 0 300 250" className="absolute inset-0 h-full w-full" aria-hidden="true">
      {/* chan de */}
      <rect x="30" y="236" width="200" height="12" rx="4" className="fill-slate-400/70" />
      <path d="M 70 196 L 50 236 L 90 236 L 95 196 Z" className="fill-amber-500/80" />
      <path d="M 190 196 L 210 236 L 170 236 L 165 196 Z" className="fill-amber-500/80" />

      {/* tay quay */}
      <line x1="220" y1="105" x2="272" y2="105" strokeWidth="5" className="stroke-amber-500/80" strokeLinecap="round" />
      <circle cx="282" cy="105" r="11" className="fill-amber-500/80" />
      <circle cx="282" cy="105" r="4" className="fill-slate-200/80" />

      {/* khung day hinh cau */}
      <g fill="none" strokeWidth="3">
        <circle cx="130" cy="105" r="88" className="stroke-sky-400/80" />
        <ellipse cx="130" cy="105" rx="88" ry="32" className="stroke-sky-300/60" />
        <ellipse cx="130" cy="105" rx="88" ry="32" transform="rotate(60 130 105)" className="stroke-sky-300/60" />
        <ellipse cx="130" cy="105" rx="88" ry="32" transform="rotate(120 130 105)" className="stroke-sky-300/60" />
      </g>

      {/* cua long */}
      <rect x="112" y="184" width="36" height="10" rx="5" className="fill-sky-400/80" />
    </svg>
  )
}
