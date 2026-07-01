import { useMemo, useState } from 'react'

export function useFilteredList(items, searchFields) {
  const [search, setSearch] = useState('')
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
      const matchesTags = selectedTags.every((tag) => itemTags.includes(tag))
      const keyword = search.trim().toLowerCase()
      const matchesSearch =
        !keyword ||
        searchFields.some((field) => item[field]?.toLowerCase().includes(keyword))
      return matchesTags && matchesSearch
    })
  }, [items, search, selectedTags, searchFields])

  return { search, setSearch, allTags, selectedTags, toggleTag, filtered }
}
