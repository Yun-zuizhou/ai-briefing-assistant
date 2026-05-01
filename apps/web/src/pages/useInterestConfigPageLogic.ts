import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../services/api';

export interface InterestCategory {
  iconKey: 'technology' | 'writing' | 'career' | 'life';
  items: string[];
  name: string;
  purpose: string;
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    name: '技术与工具',
    iconKey: 'technology',
    purpose: '影响工作方式、产品变化和可直接使用的新工具',
    items: ['AI应用', 'AI产品', '开发工具', '数据自动化', '开源项目'],
  },
  {
    name: '写作与表达',
    iconKey: 'writing',
    purpose: '能转化成写作素材、表达训练和个人知识沉淀',
    items: ['写作素材', '内容创作', '语言学习', '知识管理', '个人叙事'],
  },
  {
    name: '职业与机会',
    iconKey: 'career',
    purpose: '和远程工作、项目机会、职业判断直接相关',
    items: ['远程工作', '求职机会', '自由职业', '技能成长', '行业变化'],
  },
  {
    name: '生活与决策',
    iconKey: 'life',
    purpose: '帮助筛选生活、阅读和长期决策里的实用信息',
    items: ['健康习惯', '理财观察', '城市生活', '阅读书单', '心理与效率'],
  },
];

export function useInterestConfigPageLogic() {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getUserInterests();
        if (response.error) {
          throw new Error(response.error);
        }
        setSelectedInterests(response.data?.interests ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载关注失败');
      } finally {
        setLoading(false);
      }
    };

    void fetchInterests();
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const toggleInterest = useCallback((interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((item) => item !== interest);
      }
      return [...prev, interest];
    });
  }, []);

  const handleComplete = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await apiService.updateUserInterests(selectedInterests);
      if (response.error) {
        throw new Error(response.error);
      }
      navigate('/today');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存关注失败');
    } finally {
      setSaving(false);
    }
  }, [navigate, selectedInterests]);

  return {
    categories: INTEREST_CATEGORIES,
    error,
    handleBack,
    handleComplete,
    loading,
    saving,
    selectedCount: selectedInterests.length,
    selectedInterests,
    toggleInterest,
  };
}
