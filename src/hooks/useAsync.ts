import { useEffect, useState } from 'react';

export function useAsync<T>(loader: () => Promise<T>, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    loader()
      .then(result => { if (active) setData(result); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'A apărut o eroare.'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, deps);

  return { data, loading, error };
}
