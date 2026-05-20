interface StatusProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
}

export function Status({ loading, error, empty, emptyText = 'Nu există date de afișat.' }: StatusProps) {
  if (loading) return <div className="status-card">Se încarcă datele...</div>;
  if (error) return <div className="status-card status-error">{error}</div>;
  if (empty) return <div className="status-card">{emptyText}</div>;
  return null;
}
