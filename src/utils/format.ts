export function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ro-RO').format(parseLocalDate(value));
}

export function parseLocalDate(value: string) {
  const dateOnly = value.slice(0, 10);
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function dateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatNumber(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: digits }).format(value);
}

export function percent(value?: number | null) {
  return `${formatNumber(value ?? 0, 0)}%`;
}

export function employeeName(employee?: { firstName?: string; lastName?: string } | null) {
  if (!employee) return 'N/A';
  return `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim();
}
