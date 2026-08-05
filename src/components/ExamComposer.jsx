import { useState } from 'react'
import { ArrowUp, ArrowDown, X, FileDown, Printer, AlertTriangle } from 'lucide-react'
import { RESOURCE_SUBJECTS, RESOURCE_GRADES, BLOOM_LABELS } from '@/lib/resourceTaxonomy'
import {
  Breadcrumb,
  SubjectPicker,
  GradeGrid,
  QuestionBrowserView,
  useQuestionPool,
  questionText,
} from '@/components/QuestionBank'
import {
  isPrintable,
  sampleByMatrix,
  toPlainQuestion,
  buildStaticExamHtml,
  buildInteractiveExamHtml,
  downloadHtml,
  printHtml,
} from '@/lib/examBuilder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import AccentCard from '@/components/AccentCard'

const BLOOM_KEYS = ['biet', 'hieu', 'vandung', 'vandungcao']

function ExamCart({ questions, onRemove, onMove }) {
  if (!questions.length) {
    return <p className="text-sm text-muted-foreground">Chưa có câu hỏi nào trong đề. Chọn câu ở tab "Soạn thủ công" hoặc tạo nhanh ở tab "Soạn theo ma trận".</p>
  }
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {questions.map((q, i) => (
        <div key={q.id ?? i} className="flex items-start justify-between gap-2 px-3 py-2">
          <p className="text-sm">
            {i + 1}. {questionText(q)}
            {q.type === 'dragdrop' && (
              <span className="ml-1.5 text-xs text-amber-500">(chỉ dùng được ở bản tương tác)</span>
            )}
          </p>
          <div className="flex shrink-0 gap-0.5">
            <Button variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => onMove(i, -1)} aria-label="Lên">
              <ArrowUp className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" disabled={i === questions.length - 1} onClick={() => onMove(i, 1)} aria-label="Xuống">
              <ArrowDown className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onRemove(q)} aria-label="Bỏ khỏi đề">
              <X className="size-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function MatrixBuilder({ candidates, counts, setCounts, onGenerate, warnings }) {
  const available = Object.fromEntries(BLOOM_KEYS.map((k) => [k, candidates.filter((q) => q.bloom === k).length]))
  const total = BLOOM_KEYS.reduce((sum, k) => sum + (Number(counts[k]) || 0), 0)

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <p className="text-sm text-muted-foreground">
        Chọn số lượng câu hỏi cần lấy ngẫu nhiên cho từng mức độ (trong phạm vi câu hỏi in-giấy-được, đã áp dụng bộ lọc Chủ đề/Bài nếu có ở tab Soạn thủ công).
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {BLOOM_KEYS.map((k) => (
          <div key={k} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">{BLOOM_LABELS[k]}</p>
              <p className="text-xs text-muted-foreground">Có sẵn: {available[k]} câu</p>
            </div>
            <Input
              type="number"
              min={0}
              max={available[k]}
              value={counts[k] ?? 0}
              onChange={(e) => setCounts({ ...counts, [k]: e.target.value })}
              className="w-20"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm">Tổng: <strong>{total}</strong> câu</p>
        <Button type="button" onClick={onGenerate} disabled={total === 0}>Tạo đề ngẫu nhiên</Button>
      </div>
      {warnings.length > 0 && (
        <div className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/5 p-2 text-sm text-amber-600">
          {warnings.map((w) => (
            <p key={w} className="flex items-start gap-1.5"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {w}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ExamComposer({ resources }) {
  const [subject, setSubject] = useState(null)
  const [grade, setGrade] = useState(null)
  const [mode, setMode] = useState('manual')
  const [examQuestions, setExamQuestions] = useState([])
  const [counts, setCounts] = useState({ biet: 0, hieu: 0, vandung: 0, vandungcao: 0 })
  const [matrixWarnings, setMatrixWarnings] = useState([])
  const [title, setTitle] = useState('Đề kiểm tra')
  const [duration, setDuration] = useState('45')
  const [exportError, setExportError] = useState(null)
  const [exporting, setExporting] = useState(false)

  const { questions: allQuestions, isLoading: poolLoading } = useQuestionPool(resources, 'resources-public')
  const gradeQuestions = allQuestions.filter((q) => q.subject === subject && q.grade_level === grade)
  const printableCandidates = gradeQuestions.filter(isPrintable)

  function navigateTo(depth) {
    setExamQuestions([])
    setMatrixWarnings([])
    if (depth === 0) { setSubject(null); setGrade(null) }
    else if (depth === 1) setGrade(null)
  }

  const selectedIds = new Set(examQuestions.map((q) => q.id))
  function toggleSelect(q) {
    setExamQuestions((prev) => (prev.some((x) => x.id === q.id) ? prev.filter((x) => x.id !== q.id) : [...prev, q]))
  }
  function removeQuestion(q) {
    setExamQuestions((prev) => prev.filter((x) => x.id !== q.id))
  }
  function moveQuestion(index, dir) {
    setExamQuestions((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function generateFromMatrix() {
    const { selected, warnings } = sampleByMatrix(printableCandidates, counts)
    setExamQuestions(selected)
    setMatrixWarnings(warnings)
  }

  const printableExamQuestions = examQuestions.filter(isPrintable)
  const droppedForPrint = examQuestions.length - printableExamQuestions.length
  const subjectLabel = RESOURCE_SUBJECTS[subject]?.label
  const gradeLabel = RESOURCE_GRADES[grade]?.label

  async function handleExport(kind) {
    setExportError(null)
    setExporting(true)
    try {
      if (kind === 'html-student' || kind === 'html-answer' || kind === 'print-student' || kind === 'print-answer') {
        const showAnswers = kind.endsWith('answer')
        const html = buildStaticExamHtml({
          title,
          subjectLabel,
          gradeLabel,
          duration,
          questions: printableExamQuestions.map(toPlainQuestion),
          showAnswers,
        })
        if (kind.startsWith('print')) printHtml(html)
        else downloadHtml(`${title}${showAnswers ? '_dap_an' : ''}.html`, html)
      } else if (kind === 'interactive') {
        const templateResource = resources.find((r) => r.id === examQuestions[0]?.resourceId)
        if (!templateResource) throw new Error('Cần ít nhất 1 câu hỏi để xuất đề.')
        const html = await buildInteractiveExamHtml(templateResource.url, {
          title,
          questions: examQuestions.map(toPlainQuestion),
        })
        downloadHtml(`${title}.html`, html)
      }
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumb subject={subject} grade={grade} onNavigate={navigateTo} rootLabel="Soạn đề kiểm tra" />

      {poolLoading && <p>Đang tải câu hỏi...</p>}

      {!poolLoading && !subject && (
        <SubjectPicker questions={allQuestions} onSelect={setSubject} />
      )}

      {!poolLoading && subject && !grade && (
        <GradeGrid questions={allQuestions} subject={subject} onSelect={setGrade} />
      )}

      {!poolLoading && subject && grade && (
        <div className="space-y-4">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              <TabsTrigger value="manual">Soạn thủ công</TabsTrigger>
              <TabsTrigger value="matrix">Soạn theo ma trận</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="pt-3">
              <QuestionBrowserView
                questions={gradeQuestions}
                selectable
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                emptyHint="Chưa có câu hỏi nào trong khối này."
              />
            </TabsContent>

            <TabsContent value="matrix" className="pt-3">
              <MatrixBuilder
                candidates={printableCandidates}
                counts={counts}
                setCounts={setCounts}
                onGenerate={generateFromMatrix}
                warnings={matrixWarnings}
              />
            </TabsContent>
          </Tabs>

          <AccentCard accent="violet" className="cursor-default gap-3 p-4">
            <p className="font-medium">Đề đang soạn ({examQuestions.length} câu)</p>
            <ExamCart questions={examQuestions} onRemove={removeQuestion} onMove={moveQuestion} />

            {examQuestions.length > 0 && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Tiêu đề đề kiểm tra</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Thời gian làm bài (phút)</Label>
                    <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
                  </div>
                </div>

                {droppedForPrint > 0 && (
                  <p className="flex items-start gap-1.5 text-sm text-amber-500">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    {droppedForPrint} câu dạng "Kéo thả" sẽ bị bỏ khi xuất bản in giấy/PDF (chỉ dùng được ở bản tương tác).
                  </p>
                )}
                {exportError && <p className="text-sm text-destructive">{exportError}</p>}

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" disabled={exporting} onClick={() => handleExport('html-student')}>
                    <FileDown className="size-3.5" /> Tải đề HS (HTML)
                  </Button>
                  <Button variant="outline" size="sm" disabled={exporting} onClick={() => handleExport('html-answer')}>
                    <FileDown className="size-3.5" /> Tải đáp án (HTML)
                  </Button>
                  <Button variant="outline" size="sm" disabled={exporting} onClick={() => handleExport('print-student')}>
                    <Printer className="size-3.5" /> In / Lưu PDF — đề HS
                  </Button>
                  <Button variant="outline" size="sm" disabled={exporting} onClick={() => handleExport('print-answer')}>
                    <Printer className="size-3.5" /> In / Lưu PDF — đáp án
                  </Button>
                  <Button variant="outline" size="sm" disabled={exporting} onClick={() => handleExport('interactive')}>
                    <FileDown className="size-3.5" /> Tải đề tương tác (HTML)
                  </Button>
                </div>
              </>
            )}
          </AccentCard>
        </div>
      )}
    </div>
  )
}
