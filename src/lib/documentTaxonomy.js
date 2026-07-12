const MATERIAL_TYPES = {
  ke_hoach_bai_day: { label: 'Kế hoạch bài dạy' },
  bai_giang_tuong_tac: { label: 'Bài giảng tương tác' },
}

const GRADES = {
  khoi_6: { label: 'Khối 6', children: MATERIAL_TYPES },
  khoi_7: { label: 'Khối 7', children: MATERIAL_TYPES },
  khoi_8: { label: 'Khối 8', children: MATERIAL_TYPES },
  khoi_9: { label: 'Khối 9', children: MATERIAL_TYPES },
}

export const DOCUMENT_TAXONOMY = {
  giang_day: {
    label: 'Giảng dạy',
    children: {
      tin_hoc: { label: 'Tin học', children: GRADES },
      hdtn: { label: 'HĐTN' },
      lap_trinh: { label: 'Lập trình' },
      robot: { label: 'Robot' },
    },
  },
  hoc_tap: { label: 'Học tập' },
}

// path: array of keys, e.g. ['giang_day', 'tin_hoc', 'khoi_6']
export function getTaxonomyNode(path) {
  let node = { children: DOCUMENT_TAXONOMY }
  for (const key of path) {
    node = node.children?.[key]
    if (!node) return null
  }
  return node
}

// maps a path array to the documents table columns it filters on
export const PATH_COLUMNS = ['category', 'subject', 'grade_level', 'material_type']

export function pathToFilters(path) {
  const filters = {}
  path.forEach((value, i) => {
    filters[PATH_COLUMNS[i]] = value
  })
  return filters
}
