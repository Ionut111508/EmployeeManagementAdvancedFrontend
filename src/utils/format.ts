export function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ro-RO').format(new Date(value));
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
