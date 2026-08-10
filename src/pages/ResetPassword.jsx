import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Supabase gui link "quen mat khau" kem token dat trong URL hash (#access_token=...&type=recovery).
// supabase-js tu doc token do luc trang tai va ban su kien PASSWORD_RECOVERY qua onAuthStateChange —
// trang nay chi can lang nghe su kien do, roi goi updateUser({password}) de doi mat khau that.
export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Phong truong hop su kien da ban ra truoc khi effect nay kip dang ky.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Mật khẩu cần ít nhất 6 ký tự.')
      return
    }
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp.')
      return
    }
    setSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-sm mx-auto mt-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Đã đổi mật khẩu!</h1>
        <p className="text-muted-foreground">Đang chuyển sang trang đăng nhập...</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="max-w-sm mx-auto mt-12 text-center">
        <h1 className="text-2xl font-semibold mb-4">Đặt lại mật khẩu</h1>
        <p className="text-muted-foreground">
          Đang xác thực link đặt lại mật khẩu... Nếu trang này không đổi sau vài giây, link có
          thể đã hết hạn hoặc đã dùng rồi — hãy yêu cầu gửi lại email đặt lại mật khẩu mới.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-2xl font-semibold mb-4">Đặt lại mật khẩu</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="password">Mật khẩu mới</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirm">Nhập lại mật khẩu mới</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Đang lưu...' : 'Đặt mật khẩu mới'}
        </Button>
      </form>
    </div>
  )
}
