import { Newspaper, TrendingUp, CheckSquare, FileText, MessageCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

const tabs = [
  { path: '/chat', icon: MessageCircle, label: '对话' },
  { path: '/today', icon: Newspaper, label: '简报' },
  { path: '/todo', icon: CheckSquare, label: '待办' },
  { path: '/log', icon: FileText, label: '日志' },
  { path: '/growth', icon: TrendingUp, label: '成长' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/today') {
      return location.pathname === '/today';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav" aria-label="主导航">
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        const Icon = tab.icon;
        return (
          <Button
            type="button"
            variant="unstyled"
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`nav-btn ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav-btn-icon" aria-hidden="true">
              <Icon size={22} strokeWidth={2.1} />
            </span>
            <span className="nav-btn-label">{tab.label}</span>
          </Button>
        );
      })}
    </nav>
  );
}
