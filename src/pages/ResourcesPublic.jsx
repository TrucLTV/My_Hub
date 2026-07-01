import { useQuery } from '@tanstack/react-query'
import { fetchPublicResources } from '@/lib/queries/resources'
import ContentCard from '@/components/ContentCard'

export default function ResourcesPublic() {
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources', 'public'],
    queryFn: fetchPublicResources,
  })

  if (isLoading) return <p>Đang tải...</p>
  if (error) return <p className="text-destructive">Lỗi: {error.message}</p>
  if (!resources?.length) return <p className="text-muted-foreground">Chưa có tài nguyên công khai.</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Tài nguyên</h1>
      {resources.map((resource) => (
        <ContentCard key={resource.id} title={resource.title} description={resource.description} tags={resource.tags}>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline"
          >
            {resource.url}
          </a>
        </ContentCard>
      ))}
    </div>
  )
}
