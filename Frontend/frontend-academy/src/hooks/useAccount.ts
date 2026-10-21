import { useEffect, useState } from 'react';
import * as api from '../lib/api';
import { parseProgress } from '../lib/storage';
export function useAccount() {
  const [session, setSession] = useState<api.AccountSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function refresh() {
    setLoading(true); setError('');
    try {
      const result = await api.getSession();
      if (result.user && result.progress && typeof result.revision === 'number') setSession({ user: result.user, progress: parseProgress(JSON.stringify(result.progress)), revision: result.revision });
      else setSession(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось соединиться с сервером.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  return { session, loading, error, refresh, setSession, setError };
}
