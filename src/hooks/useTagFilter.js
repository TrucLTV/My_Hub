import { useMemo, useState } from 'react'

export function useTagFilter(items) {
  const [selectedTags, setSelectedTags] = useState([])

  const allTags = useMemo(() => {
    const set = new Set()
    for (const item of items ?? []) {
      for (const tag of item.tags ?? item.genre ?? []) set.add(tag)
    }
    return Array.from(set).sort()
  }, [items])

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const filtered = useMemo(() => {
    return (items ?? []).filter((item) => {
      const itemTags = item.tags ?? item.genre ?? []
      return selectedTags.every((tag) => itemTags.includes(tag))
    })
  }, [items, selectedTags])

  return { allTags, selectedTags, toggleTag, filtered }
}
