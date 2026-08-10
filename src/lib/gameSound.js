// Âm thanh hiệu ứng cho mini game, sinh trực tiếp bằng Web Audio API — không cần
// file âm thanh đính kèm (nhẹ, không lo bản quyền, chạy được offline).

let audioCtx = null
let enabled = true

try {
  const stored = localStorage.getItem('minigame_sound_enabled')
  if (stored != null) enabled = stored === 'true'
} catch {
  // localStorage không khả dụng (VD: chế độ ẩn danh chặn) — giữ mặc định bật
}

function getCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function tone(freq, { duration = 0.15, type = 'sine', gain = 0.15, delay = 0 } = {}) {
  if (!enabled) return
  const ctx = getCtx()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    g.gain.value = gain
    osc.connect(g).connect(ctx.destination)
    const t0 = ctx.currentTime + delay
    osc.start(t0)
    g.gain.setValueAtTime(gain, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.stop(t0 + duration + 0.02)
  } catch {
    // môi trường không hỗ trợ Web Audio — bỏ qua âm thanh, không chặn UI
  }
}

export function playDing() {
  tone(880, { duration: 0.12 })
  tone(1318.5, { duration: 0.28, delay: 0.09 })
}

export function playWhoosh() {
  if (!enabled) return
  const ctx = getCtx()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sawtooth'
    g.gain.value = 0.05
    osc.frequency.setValueAtTime(120, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.3)
    osc.connect(g).connect(ctx.destination)
    osc.start()
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // bỏ qua nếu môi trường không hỗ trợ
  }
}

export function isSoundEnabled() {
  return enabled
}

export function setSoundEnabled(next) {
  enabled = next
  try {
    localStorage.setItem('minigame_sound_enabled', String(next))
  } catch {
    // không lưu được cũng không sao, chỉ ảnh hưởng phiên hiện tại
  }
}
