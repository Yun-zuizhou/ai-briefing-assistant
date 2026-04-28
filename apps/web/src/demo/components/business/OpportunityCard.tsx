import { Target, MapPin, Clock, Star } from 'lucide-react';
import Button from '../../../components/ui/Button';

interface OpportunityCardProps {
  title: string;
  reward: string;
  location: string;
  description: string;
  matchScore: number;
  deadline: string;
  onViewDetail?: () => void;
  onAddPlan?: () => void;
}

export default function OpportunityCard({
  title,
  reward,
  location,
  description,
  matchScore,
  deadline,
  onViewDetail,
  onAddPlan,
}: OpportunityCardProps) {
  const fullStars = Math.round(matchScore / 20);

  return (
    <div className="bg-white rounded-card-lg shadow-card-lg p-5 w-full flex-shrink-0">
      <div className="flex items-start gap-2 mb-3">
        <Target className="text-primary flex-shrink-0 mt-0.5" size={20} />
        <h3 className="text-title text-text-primary">{title}</h3>
      </div>
      
      <div className="flex items-center gap-4 mb-3 text-body">
        <span className="text-secondary font-medium">{reward}</span>
        <span className="flex items-center gap-1 text-text-secondary">
          <MapPin size={14} />
          {location}
        </span>
      </div>
      
      <p className="text-body text-text-secondary mb-4 line-clamp-2">{description}</p>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <span className="text-caption text-text-muted">匹配度：</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={16}
                className={i <= fullStars ? 'text-warning fill-warning' : 'text-gray-300'}
              />
            ))}
          </div>
        </div>
        <span className="flex items-center gap-1 text-caption text-text-muted">
          <Clock size={14} />
          截止：{deadline}
        </span>
      </div>
      
      <div className="flex gap-3">
        <Button variant="secondary" size="sm" onClick={onViewDetail} className="flex-1">
          查看详情
        </Button>
        <Button variant="primary" size="sm" onClick={onAddPlan} className="flex-1">
          加入计划
        </Button>
      </div>
    </div>
  );
}
