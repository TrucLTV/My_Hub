import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'

// Nhúng 1 custom document property ẩn vào file .docx/.xlsx/.pptx (OOXML là file zip chứa XML)
// để chứng minh quyền tác giả sau này — không hiện khi mở/in file bình thường.
const CUSTOM_PROPS_PATH = 'docProps/custom.xml'
const RELS_PATH = '_rels/.rels'
const CONTENT_TYPES_PATH = '[Content_Types].xml'
const CUSTOM_PROPS_RELATIONSHIP_TYPE =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties'
const WATERMARK_PROPERTY_NAME = 'LTVT-Watermark'
export const WATERMARK_VALUE = 'LTVT'

function buildCustomPropsXml(existingXml) {
  if (!existingXml) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" ' +
      'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
      `<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="${WATERMARK_PROPERTY_NAME}">` +
      `<vt:lpwstr>${WATERMARK_VALUE}</vt:lpwstr></property></Properties>`
    )
  }
  if (existingXml.includes(WATERMARK_PROPERTY_NAME)) return existingXml
  const pids = [...existingXml.matchAll(/pid="(\d+)"/g)].map((m) => Number(m[1]))
  const nextPid = pids.length ? Math.max(...pids) + 1 : 2
  const newProp =
    `<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="${nextPid}" name="${WATERMARK_PROPERTY_NAME}">` +
    `<vt:lpwstr>${WATERMARK_VALUE}</vt:lpwstr></property>`
  return existingXml.replace('</Properties>', `${newProp}</Properties>`)
}

function ensureRelationship(relsXml) {
  if (relsXml.includes('docProps/custom.xml')) return relsXml
  const ids = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]))
  const nextId = ids.length ? Math.max(...ids) + 1 : 1
  const newRel = `<Relationship Id="rId${nextId}" Type="${CUSTOM_PROPS_RELATIONSHIP_TYPE}" Target="docProps/custom.xml"/>`
  return relsXml.replace('</Relationships>', `${newRel}</Relationships>`)
}

function ensureContentType(contentTypesXml) {
  if (contentTypesXml.includes('docProps/custom.xml')) return contentTypesXml
  const override =
    '<Override PartName="/docProps/custom.xml" ' +
    'ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/>'
  return contentTypesXml.replace('</Types>', `${override}</Types>`)
}

// bytes: Uint8Array của file .docx/.xlsx/.pptx gốc -> trả về Uint8Array đã nhúng watermark.
export function watermarkOoxmlBytes(bytes) {
  const files = unzipSync(bytes)

  const existingCustomXml = files[CUSTOM_PROPS_PATH] ? strFromU8(files[CUSTOM_PROPS_PATH]) : null
  files[CUSTOM_PROPS_PATH] = strToU8(buildCustomPropsXml(existingCustomXml))

  if (files[RELS_PATH]) {
    files[RELS_PATH] = strToU8(ensureRelationship(strFromU8(files[RELS_PATH])))
  }
  if (files[CONTENT_TYPES_PATH]) {
    files[CONTENT_TYPES_PATH] = strToU8(ensureContentType(strFromU8(files[CONTENT_TYPES_PATH])))
  }

  return zipSync(files)
}

export function hasWatermark(bytes) {
  try {
    const files = unzipSync(bytes)
    if (!files[CUSTOM_PROPS_PATH]) return false
    return strFromU8(files[CUSTOM_PROPS_PATH]).includes(WATERMARK_PROPERTY_NAME)
  } catch {
    return false
  }
}

const WATERMARKABLE_EXTENSIONS = new Set(['docx', 'xlsx', 'pptx'])

export function isWatermarkableExtension(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  return WATERMARKABLE_EXTENSIONS.has(ext)
}
