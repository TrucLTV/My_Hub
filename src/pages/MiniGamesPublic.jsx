import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ChevronRight, Lock, Globe, Download, Link2 } from 'lucide-react'
import { fetchPublicMiniGames, getMiniGameSignedUrl, unlockMiniGamePayload } from '@/lib/queries/miniGames'
import { MINI_GAME_CATEGORIES } from '@/lib/miniGameTaxonomy'
import { MINI_GAME_TOOLS } from '@/lib/miniGameTools'
import { accentClasses } from '@/lib/accentColors'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTagFilter } from '@/hooks/useTagFilter'
import ContentCard from '@/components/ContentCard'
import SearchBar from '@/components/SearchBar'
import TagFilter from '@/components/TagFilter'
import PageBanner from '@/components/PageBanner'
import AccentCard from '@/components/AccentCard'
import PasswordPrompt from '@/components/PasswordPrompt'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const ACCENT = 'sky'

const DELIVERY_BADGE = {
  web_tool: { icon: Globe, label: 'Chạy trên web' },
  downloadable: { icon: Download, label: 'Tải về' },
  external_link: { icon: Link2, label: 'Link ngoài' },
}

async function handleDownload(path, filename) {
  const url = await getMiniGameSignedUrl(path, filename)
  window.open(url, '_blank', 'noopener,noreferrer')
}

function CategoryGrid({ games, onOpen }) {
  const colors = accentClasses[ACCENT]
  return (
    <div className="flex flex-wrap justify-center gap-4 py-6">
      {Object.entries(MINI_GAME_CATEGORIES).map(([key, node]) => {
        const Icon = node.icon
        const count = games.filter((g) => g.category === key).length
        return (
          <AccentCard
            key={key}
            accent={ACCENT}
            onClick={() => onOpen(key)}
            className="w-36 cursor-pointer items-center gap-2 p-4 text-center sm:w-40"
          >
            <span className={`flex size-12 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}>
              <Icon className="size-6" />
            </span>
            <p className="w-full truncate font-medium text-sm">{node.label}</p>
            <p className="text-xs text-muted-foreground">{count} trò chơi</p>
          </AccentCard>
        )
      })}
    </div>
  )
}

function GameActions({ game, revealed, onRequestUnlock, onPlay }) {
  const payload = revealed ?? game
  const isLocked = game.is_locked && !revealed

  if (isLocked) {
    return (
      <Button className="w-full" onClick={onRequestUnlock}>
        <Lock className="size-4" /> Nhập mật khẩu để mở
      </Button>
    )
  }

  if (game.delivery_type === 'downloadable') {
    if (!payload.file_url) return null
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => handleDownload(payload.file_url, `${game.title}.${payload.file_type ?? ''}`)}
      >
        <Download className="size-3.5" /> Tải xuống
      </Button>
    )
  }

  if (game.delivery_type === 'external_link') {
    if (!payload.external_url) return null
    return (
      <Button className="w-full" render={<a href={payload.external_url} target="_blank" rel="noopener noreferrer" />}>
        <Link2 className="size-4" /> Mở link
      </Button>
    )
  }

  if (game.delivery_type === 'web_tool') {
    const tool = MINI_GAME_TOOLS[payload.tool_key]
    if (!tool) {
      return (
        <Button className="w-full" disabled variant="secondary">
          Sắp ra mắt
        </Button>
      )
    }
    return (
      <Button className="w-full" onClick={() => onPlay(tool, game.title)}>
        <Globe className="size-4" /> Chơi ngay
      </Button>
    )
  }

  return null
}

export default function MiniGamesPublic() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('loai')
  const isRoot = !category || !MINI_GAME_CATEGORIES[category]

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const { data: games, isLoading, error } = useQuery({
    queryKey: ['mini_games', 'public', category ?? '', isRoot ? '' : debouncedSearch],
    queryFn: () => fetchPublicMiniGames(isRoot ? '' : debouncedSearch, isRoot ? {} : { category }),
    placeholderData: keepPreviousData,
  })

  const { allTags, selectedTags, toggleTag, filtered } = useTagFilter(isRoot ? [] : games)

  const [promptId, setPromptId] = useState(null)
  const [revealed, setRevealed] = useState({})
  const [activeTool, setActiveTool] = useState(null)

  async function handleUnlock(password) {
    const payload = await unlockMiniGamePayload(promptId, password)
    if (payload == null) return false
    setRevealed((prev) => ({ ...prev, [promptId]: payload }))
    return true
  }

  function openCategory(key) {
    setSearchParams({ loai: key })
  }

  function backToRoot() {
    setSearchParams({})
  }

  return (
    <div className="space-y-4">
      <PageBanner title="Mini game" subtitle="Hỗ trợ dạy học, tương tác với học sinh" />

      <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <button onClick={backToRoot} className="hover:text-foreground hover:underline">
          Mini game
        </button>
        {!isRoot && (
          <span className="flex items-center gap-1">
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">{MINI_GAME_CATEGORIES[category]?.label}</span>
          </span>
        )}
      </div>

      {error && <p className="text-destructive">Lỗi: {error.message}</p>}

      {!error && isLoading && <p>Đang tải...</p>}

      {!error && !isLoading && isRoot && <CategoryGrid games={games ?? []} onOpen={openCategory} />}

      {!error && !isLoading && !isRoot && (
        <div className="space-y-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Tìm mini game..." />
          <TagFilter tags={allTags} selected={selectedTags} onToggle={toggleTag} />
          {!filtered.length && <p className="text-muted-foreground">Chưa có mini game nào trong danh mục này.</p>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((game) => {
              const badge = DELIVERY_BADGE[game.delivery_type]
              const BadgeIcon = badge?.icon
              return (
                <ContentCard
                  key={game.id}
                  title={game.title}
                  description={game.description}
                  tags={game.tags}
                  accent={ACCENT}
                  icon={MINI_GAME_CATEGORIES[game.category]?.icon}
                >
                  {badge && (
                    <Badge variant="outline" className="w-fit gap-1">
                      <BadgeIcon className="size-3" /> {badge.label}
                    </Badge>
                  )}
                  <GameActions
                    game={game}
                    revealed={revealed[game.id]}
                    onRequestUnlock={() => setPromptId(game.id)}
                    onPlay={(tool, title) => {
                      document.documentElement.requestFullscreen?.().catch(() => {})
                      setActiveTool({ ...tool, title })
                    }}
                  />
                </ContentCard>
              )
            })}
          </div>
        </div>
      )}

      <PasswordPrompt
        open={promptId !== null}
        onOpenChange={(v) => !v && setPromptId(null)}
        onSubmit={handleUnlock}
        title="Mini game bị khóa"
      />

      <Dialog
        open={activeTool !== null}
        onOpenChange={(v) => {
          if (!v) {
            setActiveTool(null)
            if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
          }
        }}
      >
        <DialogContent className="inset-0 top-0 left-0 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none sm:max-w-none">
          <DialogHeader>
            <DialogTitle>{activeTool?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 items-center justify-center overflow-y-auto [scrollbar-gutter:stable]">
            <div className="w-full max-w-6xl py-4">{activeTool && <activeTool.component />}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
