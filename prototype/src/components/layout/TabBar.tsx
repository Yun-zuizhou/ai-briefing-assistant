import { Newspaper, User, CheckSquare, FileText, MessageCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/chat', icon: MessageCircle, label: '对话' },
  { path: '/', icon: Newspaper, label: '简报' },
  { path: '/todo', icon: CheckSquare, label: '待办' },
  { path: '/log', icon: FileText, label: '日志' },
  { path: '/me', icon: User, label: '我的' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`nav-btn ${active ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span className="nav-btn-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
