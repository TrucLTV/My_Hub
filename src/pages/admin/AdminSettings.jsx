import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchSiteSettings, setDownloadPassword } from '@/lib/queries/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminSettings() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['site_settings'],
    queryFn: fetchSiteSettings,
  })
  const [password, setPassword] = useState('')
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: setDownloadPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_settings'] })
      setPassword('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    mutation.mutate(password)
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Cài đặt</h1>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Mật khẩu tải xuống dùng chung cho toàn site, áp dụng cho mọi nội dung ở chế độ "Khóa tải".
        </p>
        {!isLoading && (
          <p className="text-sm">
            Trạng thái hiện tại:{' '}
            {settings?.download_password_hash ? (
              <span className="text-primary">Đã đặt mật khẩu</span>
            ) : (
              <span className="text-muted-foreground">Chưa đặt mật khẩu</span>
            )}
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="new-password">Mật khẩu tải xuống mới</Label>
          <Input
            id="new-password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới"
            required
          />
        </div>
        {saved && <p className="text-sm text-primary">Đã lưu mật khẩu mới.</p>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Đang lưu...' : 'Lưu mật khẩu'}
        </Button>
      </form>
    </div>
  )
}
