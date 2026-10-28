import {
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  format,
  getDaysInMonth,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'

export function toDayString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDayString(value: string) {
  return parse(value, 'yyyy-MM-dd', new Date())
}

export function monthKeyOf(date: Date) {
  return format(date, 'yyyy-MM')
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function monthLabel(date: Date) {
  return capitalize(format(date, 'MMMM yyyy', { locale: es }))
}

export function monthLabelUpper(date: Date) {
  return format(date, 'MMMM yyyy', { locale: es }).toUpperCase()
}

export function monthShort(date: Date) {
  return format(date, 'MMM', { locale: es }).replace('.', '').toUpperCase()
}

export function longDate(date: Date) {
  return capitalize(format(date, "EEEE d 'de' MMMM", { locale: es }))
}

export function dayHeader(date: Date) {
  return format(date, "EEEE d 'de' MMMM", { locale: es }).toUpperCase()
}

export function shortDay(value: string) {
  const date = fromDayString(value)
  return format(date, 'd MMM', { locale: es }).replace('.', '').toUpperCase()
}

export function relativeDay(value: string, today = new Date()) {
  const date = fromDayString(value)
  if (toDayString(today) === value) return 'Hoy'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (toDayString(yesterday) === value) return 'Ayer'
  return format(date, "d 'de' MMMM", { locale: es })
}

export function monthRange(date: Date) {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return {
    start: toDayString(start),
    end: toDayString(end),
    days: getDaysInMonth(date),
  }
}

export function yearRange(date: Date) {
  return {
    start: toDayString(startOfYear(date)),
    end: toDayString(endOfYear(date)),
  }
}

export function lastDaysRange(days: number, today = new Date()) {
  const end = new Date(today)
  const start = new Date(today)
  start.setDate(start.getDate() - (days - 1))
  return { start: toDayString(start), end: toDayString(end) }
}

export function monthDays(date: Date) {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  })
}

export function lastMonths(count: number, today = new Date()) {
  return Array.from({ length: count }, (_, index) =>
    startOfMonth(subMonths(today, count - 1 - index)),
  )
}

export function mondayWeekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7
}

export function monthHeatmapCells(date: Date) {
  const first = startOfMonth(date)
  const days = eachDayOfInterval({ start: first, end: endOfMonth(date) })
  const leading = mondayWeekdayIndex(first)
  const cells: Array<{ date: Date; day: number; inMonth: boolean } | null> = Array.from(
    { length: leading },
    () => null,
  )
  for (const day of days) {
    cells.push({ date: day, day: day.getDate(), inMonth: true })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function weekStart(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 })
}

export function isCurrentMonth(date: Date, today = new Date()) {
  return isSameMonth(date, today)
}
