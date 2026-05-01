import { useCallback, useEffect, useMemo, useState } from 'react';

interface __Feature__ReportItem {
  id: string;
  sourceLabel: string;
  summary: string;
  title: string;
}

interface __Feature__ReportGroup {
  id: string;
  items: __Feature__ReportItem[];
  title: string;
}

interface __Feature__AuxiliaryEntry {
  id: string;
  summary: string;
  title: string;
}

interface __Feature__PageData {
  auxiliaryEntries: __Feature__AuxiliaryEntry[];
  groupedReports: __Feature__ReportGroup[];
  headline: __Feature__ReportItem;
  overview: string;
}

const UI_BOUNDARIES = {
  showInMainFlow: ['overview', 'headline', 'groupedReports'],
  showInAuxiliaryFlow: ['auxiliaryEntries'],
  keepOutOfReadingFlow: [
    'provider',
    'model',
    'rawRecommendationReason',
    'debugSeedName',
    'processingTrace',
    'rankingInternals',
  ],
};

export function use__Feature__PageLogic() {
  const [data, setData] = useState<__Feature__PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace this demo shape with the page's API domain call.
      setData({
        overview: 'Summarize what changed today. Do not expose processing metadata here.',
        headline: {
          id: 'headline',
          sourceLabel: 'Primary source',
          title: 'Most important story title',
          summary: 'Explain why this story matters before the user opens the full detail.',
        },
        groupedReports: [
          {
            id: 'group-1',
            title: 'User-facing group title',
            items: [
              {
                id: 'report-1',
                sourceLabel: 'Source',
                title: 'Report title',
                summary: 'Report summary.',
              },
            ],
          },
        ],
        auxiliaryEntries: [
          {
            id: 'ask',
            title: 'Ask about this page',
            summary: 'Continue the flow without interrupting primary reading.',
          },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Information failed to load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isEmpty = !data || (data.groupedReports.length === 0 && data.auxiliaryEntries.length === 0);

  return {
    auxiliaryEntries: data?.auxiliaryEntries ?? [],
    data,
    error,
    groupedReports: data?.groupedReports ?? [],
    headline: data?.headline ?? {
      id: 'empty',
      sourceLabel: '',
      title: 'No primary story yet',
      summary: 'The page needs a primary story before it can become a readable information flow.',
    },
    isEmpty,
    loading,
    openAuxiliaryEntry: (_entry: __Feature__AuxiliaryEntry) => {},
    openHeadline: () => {},
    openReport: (_item: __Feature__ReportItem) => {},
    overview: data?.overview ?? 'Preparing the overview.',
    reload: load,
    uiBoundaries: useMemo(() => UI_BOUNDARIES, []),
  };
}
