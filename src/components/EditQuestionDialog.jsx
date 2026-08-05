import { useEffect, useState } from 'react'
import { X, Plus } from 'lucide-react'
import { QUESTION_TYPE_LABELS, BLOOM_LABELS } from '@/lib/resourceTaxonomy'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function countBlanks(text) {
  return ((text || '').match(/___/g) || []).length
}

// Chuyen 1 cau hoi da parse (shape cua toExportQuestion trong tool soan) thanh
// state form de sua — moi dang cau 1 shape rieng, xem trac-nghiem-tuong-tac.html.
function initFormFromQuestion(q) {
  const base = { type: q.type, bloom: q.bloom || 'biet' }
  if (q.type === 'single') {
    return { ...base, question: q.question || '', options: q.options?.length ? [...q.options] : ['', ''], correctIndex: q.correctIndex ?? 0 }
  }
  if (q.type === 'multi') {
    return { ...base, question: q.question || '', options: q.options?.length ? [...q.options] : ['', ''], correctIndexes: q.correctIndexes ? [...q.correctIndexes] : [] }
  }
  if (q.type === 'order') {
    return { ...base, question: q.question || '', items: q.items?.length ? [...q.items] : ['', ''] }
  }
  if (q.type === 'match') {
    return {
      ...base,
      question: q.question || '',
      colA: (q.colA || []).map((x) => x.text),
      colB: (q.colB || []).map((x) => x.text),
    }
  }
  if (q.type === 'dragdrop') {
    return {
      ...base,
      question: q.question || '',
      items: (q.items || []).map((x) => x.text),
      targets: (q.targets || []).map((x) => x.text),
    }
  }
  if (q.type === 'fillblank') {
    return {
      ...base,
      textWithBlanks: q.textWithBlanks || '',
      answerText: (q.answers || []).map((a) => (a || []).join(', ')),
    }
  }
  return base
}

// Chieu nguoc lai: form -> dung shape toExportQuestion, de ghi de vao file.
function buildQuestionFromForm(form) {
  const { bloom } = form
  if (form.type === 'single') {
    return { type: 'single', bloom, question: form.question, options: form.options, correctIndex: form.correctIndex }
  }
  if (form.type === 'multi') {
    return { type: 'multi', bloom, question: form.question, options: form.options, correctIndexes: form.correctIndexes }
  }
  if (form.type === 'order') {
    return { type: 'order', bloom, question: form.question, items: form.items, correctOrder: form.items.map((_, i) => i) }
  }
  if (form.type === 'match') {
    return {
      type: 'match',
      bloom,
      question: form.question,
      colA: form.colA.map((t, i) => ({ id: `a${i}`, text: t })),
      colB: form.colB.map((t, i) => ({ id: `b${i}`, text: t })),
      pairs: form.colA.map((_, i) => ({ a: `a${i}`, b: `b${i}` })),
    }
  }
  if (form.type === 'dragdrop') {
    const mapping = {}
    form.items.forEach((_, i) => { mapping[`i${i}`] = `t${i}` })
    return {
      type: 'dragdrop',
      bloom,
      question: form.question,
      items: form.items.map((t, i) => ({ id: `i${i}`, text: t })),
      targets: form.targets.map((t, i) => ({ id: `t${i}`, text: t })),
      mapping,
    }
  }
  if (form.type === 'fillblank') {
    return {
      type: 'fillblank',
      bloom,
      textWithBlanks: form.textWithBlanks,
      answers: form.answerText.map((s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean)),
    }
  }
  return form
}

export default function EditQuestionDialog({ question, open, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (question) setForm(initFormFromQuestion(question))
    setError(null)
  }, [question])

  function updateListItem(key, index, value) {
    setForm((prev) => ({ ...prev, [key]: prev[key].map((v, i) => (i === index ? value : v)) }))
  }
  function addListItem(...keys) {
    setForm((prev) => {
      const next = { ...prev }
      keys.forEach((key) => { next[key] = [...prev[key], ''] })
      return next
    })
  }
  function removeListItem(...keys) {
    return (index) => {
      setForm((prev) => {
        const next = { ...prev }
        keys.forEach((key) => { next[key] = prev[key].filter((_, i) => i !== index) })
        return next
      })
    }
  }
  // Rieng options cua single/multi can chinh lai correctIndex/correctIndexes
  // theo vi tri moi sau khi xoa, khong thi tro sai dap an.
  function removeOption(index) {
    setForm((prev) => {
      const options = prev.options.filter((_, i) => i !== index)
      if (prev.type === 'single') {
        let correctIndex = prev.correctIndex
        if (index < correctIndex) correctIndex -= 1
        else if (index === correctIndex) correctIndex = 0
        return { ...prev, options, correctIndex }
      }
      const correctIndexes = prev.correctIndexes
        .filter((ci) => ci !== index)
        .map((ci) => (ci > index ? ci - 1 : ci))
      return { ...prev, options, correctIndexes }
    })
  }

  if (!form) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit(buildQuestionFromForm(form))
      onOpenChange(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa câu hỏi ({QUESTION_TYPE_LABELS[form.type] ?? form.type})</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <div className="space-y-1">
            <Label>Mức độ</Label>
            <Select value={form.bloom} onValueChange={(v) => setForm({ ...form, bloom: v })}>
              <SelectTrigger className="w-full">
                <SelectValue>{() => BLOOM_LABELS[form.bloom]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BLOOM_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.type !== 'fillblank' && (
            <div className="space-y-1">
              <Label>Câu hỏi</Label>
              <Textarea rows={2} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
            </div>
          )}

          {(form.type === 'single' || form.type === 'multi') && (
            <div className="space-y-1">
              <Label>Đáp án ({form.type === 'single' ? 'chọn 1 đúng' : 'chọn nhiều đúng'})</Label>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {form.type === 'single' ? (
                      <input
                        type="radio"
                        name="correctIndex"
                        checked={form.correctIndex === i}
                        onChange={() => setForm({ ...form, correctIndex: i })}
                      />
                    ) : (
                      <Checkbox
                        checked={form.correctIndexes.includes(i)}
                        onCheckedChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            correctIndexes: prev.correctIndexes.includes(i)
                              ? prev.correctIndexes.filter((x) => x !== i)
                              : [...prev.correctIndexes, i],
                          }))
                        }
                      />
                    )}
                    <Input value={opt} onChange={(e) => updateListItem('options', i, e.target.value)} className="flex-1" required />
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeOption(i)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addListItem('options')}>
                  <Plus className="size-3.5" /> Thêm đáp án
                </Button>
              </div>
            </div>
          )}

          {form.type === 'order' && (
            <div className="space-y-1">
              <Label>Các mục (đúng theo thứ tự đang liệt kê)</Label>
              <div className="space-y-2">
                {form.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-sm text-muted-foreground">{i + 1}.</span>
                    <Input value={item} onChange={(e) => updateListItem('items', i, e.target.value)} className="flex-1" required />
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeListItem('items')(i)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addListItem('items')}>
                  <Plus className="size-3.5" /> Thêm mục
                </Button>
              </div>
            </div>
          )}

          {form.type === 'match' && (
            <div className="space-y-1">
              <Label>Cột A ↔ Cột B (nối theo từng dòng tương ứng)</Label>
              <div className="space-y-2">
                {form.colA.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={t} onChange={(e) => updateListItem('colA', i, e.target.value)} className="flex-1" required />
                    <Input value={form.colB[i] ?? ''} onChange={(e) => updateListItem('colB', i, e.target.value)} className="flex-1" required />
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeListItem('colA', 'colB')(i)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addListItem('colA', 'colB')}>
                  <Plus className="size-3.5" /> Thêm cặp
                </Button>
              </div>
            </div>
          )}

          {form.type === 'dragdrop' && (
            <div className="space-y-1">
              <Label>Mục kéo ↔ Ô thả (tương ứng theo từng dòng)</Label>
              <div className="space-y-2">
                {form.items.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={t} onChange={(e) => updateListItem('items', i, e.target.value)} className="flex-1" required />
                    <Input value={form.targets[i] ?? ''} onChange={(e) => updateListItem('targets', i, e.target.value)} className="flex-1" required />
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeListItem('items', 'targets')(i)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addListItem('items', 'targets')}>
                  <Plus className="size-3.5" /> Thêm cặp
                </Button>
              </div>
            </div>
          )}

          {form.type === 'fillblank' && (
            <>
              <div className="space-y-1">
                <Label>Nội dung (dùng ___ để đánh dấu chỗ trống)</Label>
                <Textarea
                  rows={3}
                  value={form.textWithBlanks}
                  onChange={(e) => setForm({ ...form, textWithBlanks: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Đáp án từng chỗ trống (cách nhau dấu phẩy nếu có nhiều đáp án đúng)</Label>
                {Array.from({ length: countBlanks(form.textWithBlanks) }).map((_, i) => (
                  <Input
                    key={i}
                    placeholder={`Chỗ trống ${i + 1}`}
                    value={form.answerText[i] ?? ''}
                    onChange={(e) => {
                      const next = [...form.answerText]
                      next[i] = e.target.value
                      setForm({ ...form, answerText: next })
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
