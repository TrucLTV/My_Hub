import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, BookOpen, Clapperboard, Lock, ExternalLink } from 'lucide-react'
import { fetchPublicEntertainment, unlockEntertainmentContent } from '@/lib/queries/entertainment'
import { ENTERTAINMENT_CATEGORIES, getCategory } from '@/lib/entertainmentTaxonomy'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTagFilter } from '@/hooks/useTagFilter'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PasswordPrompt from '@/components/PasswordPrompt'
import EbookOrnament from '@/components/entertainment/EbookOrnament'

// "Phòng đọc" của trang Giải trí dùng 1 bảng màu giấy/ebook cố định, tách biệt
// khỏi theme xanh-navy tối của phần còn lại trong MyHub — không đổi theo dark/light toggle.
const ink = 'text-[#33362d]'
const inkMuted = 'text-[#767a68]'
const eyebrow = 'text-[#9c7a3f]'
const panel = 'border-[#ddd6c2] bg-[#f8f6ee]'
const sageBadge = 'bg-[#dbe6d9] text-[#3f6146]'

function LibraryCard({ category, onOpen }) {
  const Icon = category.icon
  return (
    <button
      onClick={onOpen}
      className={cn(
        'group flex flex-col gap-3 rounded-2xl border p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg',
        panel
      )}
    >
      <span className={cn('flex size-10 items-center justify-center rounded-lg', sageBadge)}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className={cn('text-xs font-semibold uppercase tracking-[0.2em]', eyebrow)}>Ebook</p>
        <h2 className={cn('font-serif text-2xl font-bold', ink)}>{category.label}</h2>
        <p className={cn('mt-1 font-serif text-sm italic', inkMuted)}>{category.subtitle}</p>
      </div>
      <p className={cn('line-clamp-2 text-sm', inkMuted)}>{category.intro}</p>
      <span className="mt-1 flex items-center gap-1 text-sm font-medium text-[#3f6146] transition-transform group-hover:translate-x-1">
        Đọc ngay <ArrowLeft className="size-3.5 rotate-180" />
      </span>
    </button>
  )
}

function Library({ onOpenCategory }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p className={cn('text-xs font-semibold uppercase tracking-[0.2em]', eyebrow)}>Giải trí</p>
      <h1 className={cn('mt-2 font-serif text-4xl font-bold sm:text-5xl', ink)}>Góc đọc & thư giãn</h1>
      <p className={cn('mt-3 max-w-xl font-serif text-lg italic', inkMuted)}>
        4 tuyển tập nhỏ để bạn ghé qua mỗi khi cần một khoảng nghỉ.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {ENTERTAINMENT_CATEGORIES.map((cat) => (
          <LibraryCard key={cat.key} category={cat} onOpen={() => onOpenCategory(cat.key)} />
        ))}
      </div>
    </div>
  )
}

function ChapterSection({ index, item, revealed, onLockedClick, registerRef }) {
  const body = revealed[item.id]?.body ?? (!item.is_locked ? item.body : null)
  return (
    <section
      id={`chapter-${item.id}`}
      data-id={item.id}
      ref={(el) => registerRef(item.id, el)}
      className="scroll-mt-24 border-t border-[#ddd6c2] pt-8 first:border-t-0 first:pt-0"
    >
      <div className="flex items-center gap-3">
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full font-serif text-sm font-bold', sageBadge)}>
          {index}
        </span>
        <div className="min-w-0">
          <p className={cn('text-xs font-semibold uppercase tracking-[0.15em]', eyebrow)}>Phần {index}</p>
          <h2 className={cn('font-serif text-2xl font-bold', ink)}>{item.title}</h2>
        </div>
      </div>
      {item.description && <p className={cn('mt-2 font-serif italic', inkMuted)}>{item.description}</p>}
      {item.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-[#ddd6c2] text-[#767a68]">{tag}</Badge>
          ))}
        </div>
      )}
      {item.is_locked && !revealed[item.id] && (
        <Button size="sm" className="mt-4 bg-[#3f6146] hover:bg-[#33502f]" onClick={() => onLockedClick(item)}>
          <Lock className="size-4" /> Nhập mật khẩu để đọc
        </Button>
      )}
      {body && (
        <div className="prose prose-sm sm:prose-base mt-4 max-w-none font-serif prose-headings:font-serif prose-headings:text-[#33362d] prose-p:text-[#3a3d33] prose-strong:text-[#242620] prose-a:text-[#3f6146]">
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      )}
    </section>
  )
}

function MediaCard({ item, revealed, onLockedClick }) {
  const url = revealed[item.id]?.media_url ?? item.media_url
  return (
    <div className={cn('overflow-hidden rounded-xl border', panel)}>
      {item.media_kind === 'image' && url && <img src={url} alt={item.title} className="aspect-video w-full object-cover" />}
      {item.media_kind === 'video' && url && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={url} controls className="aspect-video w-full bg-black" />
      )}
      {item.media_kind === 'link' && item.cover_url && (
        <img src={item.cover_url} alt={item.title} className="aspect-video w-full object-cover" />
      )}
      <div className="space-y-1.5 p-3">
        <p className={cn('font-serif text-sm font-semibold', ink)}>{item.title}</p>
        {item.description && <p className={cn('text-xs', inkMuted)}>{item.description}</p>}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-[#ddd6c2] text-xs text-[#767a68]">{tag}</Badge>
            ))}
          </div>
        )}
        {item.is_locked && !revealed[item.id] && (
          <Button size="sm" className="w-full bg-[#3f6146] hover:bg-[#33502f]" onClick={() => onLockedClick(item)}>
            <Lock className="size-4" /> Nhập mật khẩu
          </Button>
        )}
        {item.media_kind === 'link' && url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-[#ddd6c2]"
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="size-3.5" /> Mở liên kết
          </Button>
        )}
      </div>
    </div>
  )
}

function MediaTab({ items, revealed, onLockedClick }) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { allTags, selectedTags, toggleTag, filtered } = useTagFilter(items)
  const q = debouncedSearch.trim().toLowerCase()
  const shown = q
    ? filtered.filter((i) => `${i.title} ${i.description ?? ''}`.toLowerCase().includes(q))
    : filtered

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} placeholder="Tìm video/hình ảnh..." />
      <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
      {!shown.length && <p className={inkMuted}>Chưa có mục nào.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((item) => (
          <MediaCard key={item.id} item={item} revealed={revealed} onLockedClick={onLockedClick} />
        ))}
      </div>
    </div>
  )
}

function ReadingRoom({ category, allItems, onBack }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('loai') === 'media' ? 'media' : 'article'

  const categoryItems = allItems.filter((i) => i.category === category.key)
  const articles = categoryItems.filter((i) => i.content_type === 'article').slice().reverse()
  const mediaItems = categoryItems.filter((i) => i.content_type === 'media')

  const [activeId, setActiveId] = useState(null)
  const [lockedItem, setLockedItem] = useState(null)
  const [revealed, setRevealed] = useState({})
  const sectionRefs = useRef(new Map())

  function registerRef(id, el) {
    if (el) sectionRefs.current.set(id, el)
    else sectionRefs.current.delete(id)
  }

  useEffect(() => {
    if (tab !== 'article' || !articles.length) return
    if (!activeId || !articles.some((a) => a.id === activeId)) setActiveId(articles[0].id)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.dataset.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    )
    sectionRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, articles.map((a) => a.id).join(',')])

  function scrollToChapter(id) {
    sectionRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function setTab(next) {
    setSearchParams(next === 'media' ? { muc: category.key, loai: 'media' } : { muc: category.key })
  }

  async function handleUnlock(password) {
    const content = await unlockEntertainmentContent(lockedItem.id, password)
    if (content == null) return false
    setRevealed((prev) => ({ ...prev, [lockedItem.id]: content }))
    return true
  }

  const Icon = category.icon

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <button onClick={onBack} className={cn('mb-6 inline-flex items-center gap-1 text-sm hover:underline', inkMuted)}>
        <ArrowLeft className="size-3.5" /> Quay lại Giải trí
      </button>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center gap-2">
            <span className={cn('flex size-8 items-center justify-center rounded-md', sageBadge)}>
              <Icon className="size-4" />
            </span>
            <p className={cn('font-serif text-lg leading-tight font-bold', ink)}>{category.label}</p>
          </div>

          <div className={cn('flex gap-1 rounded-lg border p-1 text-sm', panel)}>
            <button
              onClick={() => setTab('article')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-colors',
                tab === 'article' ? cn(sageBadge) : inkMuted
              )}
            >
              <BookOpen className="size-3.5" /> Bài viết
            </button>
            <button
              onClick={() => setTab('media')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-colors',
                tab === 'media' ? cn(sageBadge) : inkMuted
              )}
            >
              <Clapperboard className="size-3.5" /> Media
            </button>
          </div>

          {tab === 'article' && articles.length > 0 && (
            <div>
              <p className={cn('text-xs font-semibold uppercase tracking-[0.15em]', inkMuted)}>Mục lục</p>
              <nav className="mt-2 flex flex-col gap-0.5">
                {articles.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => scrollToChapter(a.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      activeId === a.id ? cn('font-medium', sageBadge) : cn('hover:bg-[#f0ede1]', ink)
                    )}
                  >
                    <span className={cn('shrink-0 text-xs tabular-nums', inkMuted)}>{i + 1}</span>
                    <span className="truncate">{a.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}
        </aside>

        <main className="relative min-w-0">
          {tab === 'article' ? (
            <>
              <EbookOrnament className="pointer-events-none absolute -top-6 right-0 hidden h-64 w-56 text-[#8fa389] opacity-70 sm:block" />
              <div className="relative max-w-2xl">
                <p className={cn('text-xs font-semibold uppercase tracking-[0.2em]', eyebrow)}>Ebook</p>
                <h1 className={cn('mt-2 font-serif text-4xl leading-tight font-bold sm:text-5xl', ink)}>{category.label}</h1>
                <p className={cn('mt-4 font-serif text-lg italic', inkMuted)}>{category.subtitle}</p>
                <p className={cn('mt-4 leading-relaxed', inkMuted)}>{category.intro}</p>
              </div>
              <div className="relative mt-10 max-w-2xl space-y-8">
                {!articles.length && <p className={inkMuted}>Chưa có bài viết nào.</p>}
                {articles.map((item, i) => (
                  <ChapterSection
                    key={item.id}
                    index={i + 1}
                    item={item}
                    revealed={revealed}
                    onLockedClick={setLockedItem}
                    registerRef={registerRef}
                  />
                ))}
              </div>
            </>
          ) : (
            <MediaTab items={mediaItems} revealed={revealed} onLockedClick={setLockedItem} />
          )}
        </main>
      </div>

      <PasswordPrompt
        open={lockedItem !== null}
        onOpenChange={(v) => !v && setLockedItem(null)}
        onSubmit={handleUnlock}
        title="Nội dung bị khóa"
      />
    </div>
  )
}

export default function Entertainment() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryKey = searchParams.get('muc')
  const category = categoryKey ? getCategory(categoryKey) : null

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['entertainment', 'public', 'all'],
    queryFn: () => fetchPublicEntertainment(),
  })

  function openCategory(key) {
    setSearchParams({ muc: key })
  }

  function backToLibrary() {
    setSearchParams({})
  }

  return (
    <div className="-mt-4 min-h-[70vh] w-screen mx-[calc(50%-50vw)] bg-[#eeece0]">
      {!category && <Library onOpenCategory={openCategory} />}
      {category && error && <p className="px-4 py-10 text-center text-destructive">Lỗi: {error.message}</p>}
      {category && !error && isLoading && <p className={cn('px-4 py-10 text-center', inkMuted)}>Đang tải...</p>}
      {category && !error && !isLoading && (
        <ReadingRoom category={category} allItems={items ?? []} onBack={backToLibrary} />
      )}
    </div>
  )
}
