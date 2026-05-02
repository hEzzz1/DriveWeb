const BEIJING_TIME_ZONE = 'Asia/Shanghai'

const fullFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: BEIJING_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const compactFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: BEIJING_TIME_ZONE,
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const timezonePattern = /(?:[zZ]|[+\-]\d{2}:?\d{2})$/
const beijingDateTimePattern =
  /^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](\d{2})(?::(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?)?$/

export function parseTimestamp(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return normalizeNumericTimestamp(value)
  }

  const text = value.trim()

  if (!text) {
    return null
  }

  if (/^\d+(?:\.\d+)?$/.test(text)) {
    return normalizeNumericTimestamp(Number(text))
  }

  const beijingParsed = parseBeijingDateTime(text)

  if (beijingParsed !== null) {
    return beijingParsed
  }

  const parsed = Date.parse(text)
  return Number.isNaN(parsed) ? null : parsed
}

export function formatDateTime(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const timestamp = parseTimestamp(value)

  if (timestamp === null) {
    return typeof value === 'string' && value.trim() ? value : '-'
  }

  return formatWithFormatter(timestamp, fullFormatter, true)
}

export function formatCompactDateTime(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const timestamp = parseTimestamp(value)

  if (timestamp === null) {
    return typeof value === 'string' && value.trim() ? value : '-'
  }

  return formatWithFormatter(timestamp, compactFormatter, false)
}

export function formatCurrentDateTime(): string {
  return formatDateTime(Date.now())
}

function normalizeNumericTimestamp(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }

  return Math.abs(value) < 1e12 ? value * 1000 : value
}

function parseBeijingDateTime(value: string): number | null {
  if (timezonePattern.test(value)) {
    return null
  }

  const match = value.match(beijingDateTimePattern)

  if (!match) {
    return null
  }

  const [, year, month, day, hour = '00', minute = '00', second = '00', millisecond = '0'] = match
  const ms = millisecond.padEnd(3, '0')

  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) - 8,
    Number(minute),
    Number(second),
    Number(ms),
  )
}

function formatWithFormatter(
  value: number,
  formatter: Intl.DateTimeFormat,
  includeYear: boolean,
): string {
  const parts = formatter.formatToParts(new Date(value))
  const record = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const dateText = includeYear
    ? `${record.year}/${record.month}/${record.day}`
    : `${record.month}/${record.day}`

  return `${dateText} ${record.hour}:${record.minute}${includeYear ? `:${record.second}` : ''}`
}
