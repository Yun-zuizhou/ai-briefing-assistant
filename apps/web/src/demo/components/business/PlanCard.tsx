import { Target, Clock } from 'lucide-react';
import Button from '../../../components/ui/Button';

interface PlanCardProps {
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
  deadline: string;
  onAction?: (action: string) => void;
}

const statusConfig = {
  pending: { label: '待投递', color: 'text-warning', icon: '⏳' },
  in_progress: { label: '进行中', color: 'text-primary', icon: '🔄' },
  completed: { label: '已完成', color: 'text-success', icon: '✅' },
  abandoned: { label: '已放弃', color: 'text-text-muted', icon: '❌' },
};

export default function PlanCard({ title, status, deadline, onAction }: PlanCardProps) {
  const config = statusConfig[status];
  const isAbandoned = status === 'abandoned';

  return (
    <div className={`bg-white rounded-card shadow-card p-4 ${isAbandoned ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-2 mb-2">
        <Target className="text-primary flex-shrink-0 mt-0.5" size={18} />
        <h3 className="text-subtitle text-text-primary">{title}</h3>
      </div>
      
      <div className="flex items-center gap-4 mb-3 text-caption">
        <span className={`flex items-center gap-1 ${config.color}`}>
          <span>{config.icon}</span>
          {config.label}
        </span>
        {!isAbandoned && (
          <span className="flex items-center gap-1 text-text-muted">
            <Clock size={14} />
            截止：{deadline}
          </span>
        )}
      </div>
      
      {!isAbandoned && (
        <div className="flex gap-2">
          {status === 'pending' && (
            <>
              <Button variant="primary" size="sm" onClick={() => onAction?.('submitted')}>
                已投递
              </Button>
              <Button variant="text" size="sm" onClick={() => onAction?.('need_help')}>
                需要帮助
              </Button>
              <Button variant="text" size="sm" className="text-text-muted" onClick={() => onAction?.('abandon')}>
                放弃
              </Button>
            </>
          )}
          {status === 'in_progress' && (
            <>
              <Button variant="primary" size="sm" onClick={() => onAction?.('remind')}>
                跟进提醒
              </Button>
              <Button variant="text" size="sm" onClick={() => onAction?.('detail')}>
                查看详情
              </Button>
            </>
          )}
        </div>
      )}
      
      {isAbandoned && (
        <p className="text-caption text-text-muted italic">"放弃也是一种努力，看看别的吧"</p>
      )}
    </div>
  );
}
