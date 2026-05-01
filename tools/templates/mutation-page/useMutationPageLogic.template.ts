import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiService } from '../services/api';

type __Feature__Filter = 'active' | 'completed';

interface __Feature__Item {
  id: number;
  title: string;
  done: boolean;
}

interface __Feature__PageState {
  items: __Feature__Item[];
  loading: boolean;
  error: string;
}

const initialState: __Feature__PageState = {
  items: [],
  loading: true,
  error: '',
};

export function use__Feature__PageLogic() {
  const [filter, setFilter] = useState<__Feature__Filter>('active');
  const [state, setState] = useState<__Feature__PageState>(initialState);

  const reload = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));

    try {
      const response = await apiService.get__Feature__PageData();
      if (response.error) {
        throw new Error(response.error);
      }
      setState({
        items: response.data?.items ?? [],
        loading: false,
        error: '',
      });
    } catch {
      setState({
        items: [],
        loading: false,
        error: 'Failed to load this page.',
      });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleItem = useCallback(async (item: __Feature__Item) => {
    try {
      const response = await apiService.update__Feature__Item(item.id, { done: !item.done });
      if (response.error) {
        throw new Error(response.error);
      }
      void reload();
    } catch {
      setState((current) => ({
        ...current,
        error: 'Failed to update this item.',
      }));
      void reload();
    }
  }, [reload]);

  const filteredItems = useMemo(() => (
    state.items.filter((item) => (filter === 'completed' ? item.done : !item.done))
  ), [filter, state.items]);

  const filterCounts = useMemo(() => ({
    active: state.items.filter((item) => !item.done).length,
    completed: state.items.filter((item) => item.done).length,
  }), [state.items]);

  const handlePrimaryAction = useCallback(() => {
    const firstActiveItem = state.items.find((item) => !item.done);
    if (firstActiveItem) {
      void toggleItem(firstActiveItem);
    }
  }, [state.items, toggleItem]);

  return {
    ...state,
    filter,
    filterCounts,
    filteredItems,
    handlePrimaryAction,
    reload,
    setFilter,
    toggleItem,
  };
}
