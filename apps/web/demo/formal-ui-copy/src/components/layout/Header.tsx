import { ArrowLeft, Share2, Settings, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
          <button onClick={() => navigate(-1)} className="mr-3 text-paper/70 hover:text-paper transition-colors">
            <ArrowLeft size={22} />
          </button>
        )}
        <h1 className="text-lg font-bold text-paper tracking-wider">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {showBell && (
          <button className="text-paper/70 hover:text-paper transition-colors">
            <Bell size={20} />
          </button>
        )}
        {showShare && (
          <button onClick={onShare} className="text-paper/70 hover:text-paper transition-colors">
            <Share2 size={20} />
          </button>
        )}
        {showSettings && (
          <button className="text-paper/70 hover:text-paper transition-colors">
            <Settings size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
