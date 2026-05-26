interface StatusProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
}

export function Status({ loading, error, empty, emptyText = 'No data to display.' }: StatusProps) {
  if (loading) return <div className="status-card">Loading data...</div>;
  if (error) return <div className="status-card status-error">{error}</div>;
  if (empty) return <div className="status-card">{emptyText}</div>;
  return null;
}
