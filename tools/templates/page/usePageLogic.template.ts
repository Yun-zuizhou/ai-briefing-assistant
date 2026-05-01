import { useCallback, useEffect, useState } from 'react';

import { apiService } from '../services/api';
import type { __Feature__PageData } from '../types/page-data';

interface __Feature__PageState {
  data: __Feature__PageData | null;
  loading: boolean;
  error: string;
}

const initialState: __Feature__PageState = {
  data: null,
  loading: true,
  error: '',
};

export function use__Feature__PageLogic() {
  const [state, setState] = useState<__Feature__PageState>(initialState);

  const loadPageData = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));

    try {
      const data = await apiService.get__Feature__PageData();
      setState({
        data,
        loading: false,
        error: '',
      });
    } catch {
      setState({
        data: null,
        loading: false,
        error: 'Failed to load this page.',
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiService.get__Feature__PageData();
        if (!cancelled) {
          setState({
            data,
            loading: false,
            error: '',
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: 'Failed to load this page.',
          });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...state,
    isEmpty: !state.loading && !state.error && state.data === null,
    reload: loadPageData,
  };
}
