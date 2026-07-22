const ID_LOCALE = 'id-ID'

export const formatNumberID = (value, options = {}) => {
  const number = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(number)) return '0'

  return new Intl.NumberFormat(ID_LOCALE, {
    maximumFractionDigits: 3,
    ...options,
  }).format(number)
}

export const formatRupiah = (value) =>
  `Rp ${formatNumberID(value, { maximumFractionDigits: 0 })}`

export const parseNumberID = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const normalized = String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')

  const number = Number(normalized)
  return Number.isFinite(number) ? number : 0
}

export const formatIntegerInputID = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits ? formatNumberID(Number(digits), { maximumFractionDigits: 0 }) : ''
}

export const normalizeDecimalInputID = (value) => {
  const cleaned = String(value ?? '')
    .replace(/\./g, '')
    .replace(/[^\d,]/g, '')

  const [integerPart = '', ...decimalParts] = cleaned.split(',')
  return decimalParts.length > 0
    ? `${integerPart},${decimalParts.join('')}`
    : integerPart
}
