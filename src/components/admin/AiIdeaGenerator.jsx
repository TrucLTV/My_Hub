import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Copy, Check, Wand2, Plus, CheckCircle2 } from 'lucide-react'
import { createMiniGame } from '@/lib/queries/miniGames'
import { MINI_GAME_CATEGORIES } from '@/lib/miniGameTaxonomy'
import { buildIdeaPrompt, parseIdeaJson, ideaToDescription, IDEAS_PER_REQUEST } from '@/lib/aiIdeaPrompt'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const emptyCriteria = {
  category: '',
  subject: '',
  studentCount: '',
  duration: '',
  energyLevel: '',
  notes: '',
}

const ENERGY_LEVELS = ['Nhẹ nhàng', 'Vừa', 'Sôi động']

export default function AiIdeaGenerator() {
  const queryClient = useQueryClient()
  const [criteria, setCriteria] = useState(emptyCriteria)
  const [prompt, setPrompt] = useState('')
  const [copied, setCopied] = useState(false)
  const [rawJson, setRawJson] = useState('')
  const [ideas, setIdeas] = useState([])
  const [parseError, setParseError] = useState('')
  const [savedIndexes, setSavedIndexes] = useState({})

  const saveMutation = useMutation({
    mutationFn: (payload) => createMiniGame(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mini_games'] }),
  })

  function handleGeneratePrompt() {
    setPrompt(buildIdeaPrompt(criteria))
    setCopied(false)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setParseError('Không copy được tự động, hãy bôi đen và copy thủ công.')
    }
  }

  function handleParse() {
    setParseError('')
    setSavedIndexes({})
    try {
      const parsed = parseIdeaJson(rawJson)
      setIdeas(parsed)
    } catch (err) {
      setIdeas([])
      setParseError(err.message)
    }
  }

  function handleSaveIdea(idea, index) {
    saveMutation.mutate(
      {
        title: idea.title,
        description: ideaToDescription(idea),
        category: idea.category,
        delivery_type: 'idea',
        tool_key: null,
        file_url: null,
        file_type: null,
        external_url: null,
        tags: idea.tags,
        is_public: false,
        is_locked: false,
        sort_order: null,
      },
      {
        onSuccess: () => setSavedIndexes((prev) => ({ ...prev, [index]: true })),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4" />
          Tạo ý tưởng mini game bằng AI
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Điền tiêu chí → sinh prompt → dán vào khung chat AI bất kỳ (Claude, ChatGPT...) → dán kết quả JSON
          ngược lại đây → chọn ý tưởng ưng ý để lưu vào kho mini game (dạng "ý tưởng chờ code").
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bước 1: tiêu chí */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Bước 1 — Tiêu chí</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Loại hoạt động</Label>
              <Select value={criteria.category} onValueChange={(v) => setCriteria({ ...criteria, category: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Không giới hạn">
                    {() => MINI_GAME_CATEGORIES[criteria.category]?.label ?? 'Không giới hạn'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MINI_GAME_CATEGORIES).map(([key, node]) => (
                    <SelectItem key={key} value={key}>{node.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="subject">Môn học / chủ đề bài học</Label>
              <Input
                id="subject"
                placeholder="VD: ôn tập vòng lặp for, lớp 8"
                value={criteria.subject}
                onChange={(e) => setCriteria({ ...criteria, subject: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="studentCount">Số lượng học sinh</Label>
              <Input
                id="studentCount"
                placeholder="VD: cả lớp 35 HS, chia nhóm 4 người"
                value={criteria.studentCount}
                onChange={(e) => setCriteria({ ...criteria, studentCount: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="duration">Thời gian dự kiến</Label>
              <Input
                id="duration"
                placeholder="VD: 5 phút, 10 phút cuối giờ"
                value={criteria.duration}
                onChange={(e) => setCriteria({ ...criteria, duration: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Mức độ sôi động</Label>
              <Select value={criteria.energyLevel} onValueChange={(v) => setCriteria({ ...criteria, energyLevel: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Không giới hạn">
                    {() => criteria.energyLevel || 'Không giới hạn'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ENERGY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Ghi chú thêm</Label>
              <Input
                id="notes"
                placeholder="VD: muốn có yếu tố thi đua giữa các nhóm"
                value={criteria.notes}
                onChange={(e) => setCriteria({ ...criteria, notes: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleGeneratePrompt}>
            <Wand2 className="size-4" /> Tạo prompt ({IDEAS_PER_REQUEST} ý tưởng)
          </Button>
        </div>

        {/* Bước 2: prompt sinh ra */}
        {prompt && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Bước 2 — Copy prompt và dán vào khung chat AI</p>
            <Textarea readOnly rows={10} value={prompt} className="font-mono text-xs" />
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Đã copy!' : 'Copy prompt'}
            </Button>
          </div>
        )}

        {/* Bước 3: dán JSON kết quả */}
        {prompt && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Bước 3 — Dán kết quả JSON mà AI trả về</p>
            <Textarea
              rows={8}
              placeholder='Dán JSON dạng [{"title": "...", "description": "...", ...}] vào đây'
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="font-mono text-xs"
            />
            <Button onClick={handleParse}>Phân tích kết quả</Button>
            {parseError && <p className="text-sm text-destructive">{parseError}</p>}
          </div>
        )}

        {/* Bước 4: danh sách ý tưởng */}
        {ideas.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Bước 4 — Chọn ý tưởng để lưu vào kho mini game</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {ideas.map((idea, index) => (
                <div key={index} className="border rounded-md p-3 space-y-2">
                  <p className="font-medium">{idea.title}</p>
                  <Badge variant="secondary">{MINI_GAME_CATEGORIES[idea.category]?.label}</Badge>
                  {idea.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{idea.description}</p>}
                  {idea.durationMinutes && (
                    <p className="text-xs text-muted-foreground">⏱ {idea.durationMinutes} phút</p>
                  )}
                  {idea.materials && (
                    <p className="text-xs text-muted-foreground">🧰 {idea.materials}</p>
                  )}
                  {idea.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {idea.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant={savedIndexes[index] ? 'secondary' : 'outline'}
                    disabled={savedIndexes[index] || saveMutation.isPending}
                    onClick={() => handleSaveIdea(idea, index)}
                  >
                    {savedIndexes[index] ? (
                      <><CheckCircle2 className="size-4" /> Đã thêm vào kho</>
                    ) : (
                      <><Plus className="size-4" /> Thêm vào kho mini game</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
