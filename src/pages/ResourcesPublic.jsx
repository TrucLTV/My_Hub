import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPublicResources, unlockResourceUrl } from '@/lib/queries/resources'
import QuestionBank from '@/components/QuestionBank'
import ExamComposer from '@/components/ExamComposer'
import PageBanner from '@/components/PageBanner'
import PasswordPrompt from '@/components/PasswordPrompt'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function ResourcesPublic() {
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources', 'public'],
    queryFn: fetchPublicResources,
  })

  const [tab, setTab] = useState('browse')
  const [lockedResource, setLockedResource] = useState(null)
  const [revealed, setRevealed] = useState({})

  async function handleUnlock(password) {
    const url = await unlockResourceUrl(lockedResource.id, password)
    if (url == null) return false
    setRevealed((prev) => ({ ...prev, [lockedResource.id]: url }))
    return true
  }

  return (
    <div className="space-y-4">
      <PageBanner title="Ngân hàng câu hỏi" subtitle="Duyệt từng câu hỏi hoặc tự soạn đề kiểm tra" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="browse">Duyệt câu hỏi</TabsTrigger>
          <TabsTrigger value="compose">Soạn đề kiểm tra</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="pt-3">
          <QuestionBank
            resources={resources}
            resourcesLoading={isLoading}
            resourcesError={error}
            onLockedClick={setLockedResource}
            revealedUrls={revealed}
            poolQueryKeyPrefix="resources-public"
          />
        </TabsContent>

        <TabsContent value="compose" className="pt-3">
          {isLoading && <p>Đang tải...</p>}
          {error && <p className="text-destructive">Lỗi: {error.message}</p>}
          {!isLoading && !error && <ExamComposer resources={resources} />}
        </TabsContent>
      </Tabs>

      <PasswordPrompt
        open={lockedResource !== null}
        onOpenChange={(v) => !v && setLockedResource(null)}
        onSubmit={handleUnlock}
        title="Mục bị khóa"
      />
    </div>
  )
}
