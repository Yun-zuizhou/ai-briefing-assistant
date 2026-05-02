import { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, CheckSquare, MessageCircle, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui';

const tabs = [
  { path: '/chat', icon: MessageCircle, label: '对话' },
  { path: '/today', icon: Newspaper, label: '简报' },
  { path: '/todo', icon: CheckSquare, label: '待办' },
  { path: '/growth', icon: TrendingUp, label: '成长' },
  { path: '/me', icon: User, label: '我的' },
];

const NAV_VARIANTS = new Set(['ink', 'paper', 'ledger', 'stamp']);
const NAV_VARIANT_STORAGE_KEY = 'jianbao_nav_variant';

function readNavVariant() {
  if (typeof window === 'undefined') return 'ink';
  const stored = window.localStorage.getItem(NAV_VARIANT_STORAGE_KEY);
  return stored && NAV_VARIANTS.has(stored) ? stored : 'ink';
}

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [variant, setVariant] = useState(readNavVariant);

  useEffect(() => {
    const handleStorage = () => setVariant(readNavVariant());
    const handleVariantChange = () => setVariant(readNavVariant());

    window.addEventListener('storage', handleStorage);
    window.addEventListener('jianbao-nav-variant-change', handleVariantChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('jianbao-nav-variant-change', handleVariantChange);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/today') {
      return location.pathname === '/today';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`bottom-nav bottom-nav--${variant}`} aria-label="主导航">
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
