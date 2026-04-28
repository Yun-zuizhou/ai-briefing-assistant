import { ArrowLeft, Share2, Settings, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showShare?: boolean;
  showSettings?: boolean;
  showBell?: boolean;
  onShare?: () => void;
}

export default function Header({
  title,
  showBack = false,
  showShare = false,
  showSettings = false,
  showBell = false,
  onShare,
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-ink text-paper flex items-center justify-between px-4 z-50">
      <div className="flex items-center">
        {showBack && (
          <Button
            type="button"
            variant="unstyled"
            onClick={() => navigate(-1)}
            className="mr-3 text-paper/70 hover:text-paper transition-colors"
            aria-label="返回上一页"
          >
            <ArrowLeft size={22} />
          </Button>
        )}
        <h1 className="text-lg font-bold text-paper tracking-wider">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {showBell && (
          <Button
            type="button"
            variant="unstyled"
            className="text-paper/70 hover:text-paper transition-colors"
            aria-label="打开通知"
          >
            <Bell size={20} />
          </Button>
        )}
        {showShare && (
          <Button
            type="button"
            variant="unstyled"
            onClick={onShare}
            className="text-paper/70 hover:text-paper transition-colors"
            aria-label="分享当前内容"
          >
            <Share2 size={20} />
          </Button>
        )}
        {showSettings && (
          <Button
            type="button"
            variant="unstyled"
            className="text-paper/70 hover:text-paper transition-colors"
            aria-label="打开设置"
          >
            <Settings size={20} />
          </Button>
        )}
      </div>
    </header>
  );
}
