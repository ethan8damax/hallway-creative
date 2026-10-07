// Groups photos into a "screening sequence": a wide frame full-bleed on its own,
// then pairs and threes, so a category page reads like a story, not a contact sheet.
// Each row is laid out justified (items share a height), so any mix of shapes fits.

type Shaped = { width: number | null; height: number | null }

export const aspectOf = (item: Shaped) => (item.width && item.height ? item.width / item.height : 3 / 2)

// A row fills up until its combined aspect is wide enough to read as a strip;
// two landscapes (≈3.0) or three portraits (≈2.0) both land past this line.
const ROW_TARGET = 2.2

export function screeningRows<T extends Shaped>(items: T[]): T[][] {
  const rows: T[][] = []
  let lastWasSolo = false
  let i = 0
  while (i < items.length) {
    const item = items[i]
    // Every other landscape gets the whole width to itself — the rhythm break.
    if (aspectOf(item) >= 1.2 && !lastWasSolo) {
      rows.push([item])
      lastWasSolo = true
      i++
      continue
    }
    const row = [item]
    i++
    while (i < items.length && row.length < 3 && row.reduce((sum, r) => sum + aspectOf(r), 0) < ROW_TARGET) {
      row.push(items[i++])
    }
    rows.push(row)
    lastWasSolo = false
  }
  return rows
}
