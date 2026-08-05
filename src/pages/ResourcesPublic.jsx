import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPublicResources, unlockResourceUrl } from '@/lib/queries/resources'
import QuestionBank from '@/components/QuestionBank'
import PageBanner from '@/components/PageBanner'
import PasswordPrompt from '@/components/PasswordPrompt'

export default function ResourcesPublic() {
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources', 'public'],
    queryFn: fetchPublicResources,
  })

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
      <PageBanner title="Ngân hàng câu hỏi" subtitle="Duyệt từng câu hỏi theo môn, khối, chủ đề và mức độ" />

      <QuestionBank
        resources={resources}
        resourcesLoading={isLoading}
        resourcesError={error}
        onLockedClick={setLockedResource}
        revealedUrls={revealed}
        poolQueryKeyPrefix="resources-public"
      />

      <PasswordPrompt
        open={lockedResource !== null}
        onOpenChange={(v) => !v && setLockedResource(null)}
        onSubmit={handleUnlock}
        title="Mục bị khóa"
      />
    </div>
  )
}
