// Nhúng dấu ẩn "LTVT" vào file HTML: 1 comment (không bao giờ render) + 1 thẻ display:none
// (có trong mã nguồn nhưng không hiện khi xem/in) — chỉ thấy khi xem "View Page Source".
const WATERMARK_MARKER = 'LTVT-Watermark'
export const WATERMARK_VALUE = 'LTVT'

export function watermarkHtmlText(html) {
  if (html.includes(WATERMARK_MARKER)) return html
  const marker = `<!-- ${WATERMARK_MARKER}: ${WATERMARK_VALUE} --><span style="display:none" data-ltvt-watermark="${WATERMARK_VALUE}"></span>`
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${marker}</body>`)
  }
  return marker + html
}

export function hasHtmlWatermark(text) {
  return text.includes(WATERMARK_MARKER)
}
