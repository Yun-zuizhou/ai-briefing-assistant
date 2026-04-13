import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppProvider } from './context/AppContext';
import { useAppContext } from './context/useAppContext';

const TodayPage = lazy(() => import('./pages/TodayPage'));
const ActionsPage = lazy(() => import('./pages/ActionsPage'));
const JournalPage = lazy(() => import('./pages/JournalPage'));
const GrowthPage = lazy(() => import('./pages/GrowthPage'));
const MyPage = lazy(() => import('./pages/MyPage'));
const MarksPage = lazy(() => import('./pages/MarksPage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HistoryLogsPage = lazy(() => import('./pages/HistoryLogsPage'));
const HistoryBriefPage = lazy(() => import('./pages/HistoryBriefPage'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const InterestConfigPage = lazy(() => import('./pages/InterestConfigPage'));
const WeeklyReportPage = lazy(() => import('./pages/WeeklyReportPage'));
const MonthlyReportPage = lazy(() => import('./pages/MonthlyReportPage'));
const AnnualReportPage = lazy(() => import('./pages/AnnualReportPage'));
const DesignPreviewPage = lazy(() => import('./pages/DesignPreviewPage'));
const StylePreviewPage = lazy(() => import('./pages/StylePreviewPage'));
const DecorPreviewPage = lazy(() => import('./pages/DecorPreviewPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const HotTopicsPage = lazy(() => import('./pages/HotTopicsPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotificationSettingsPage = lazy(() => import('./pages/NotificationSettingsPage'));
const HelpFeedbackPage = lazy(() => import('./pages/HelpFeedbackPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper, #f5f0e6)',
        color: 'var(--ink-muted, #6b655d)',
        fontSize: '14px',
      }}
    >
      页面加载中...
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAppContext();
  if (!user.isLoggedIn) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
    }}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/interest-config" element={<InterestConfigPage />} />
          <Route path="/" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
          <Route path="/today" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/hot-topics" element={<ProtectedRoute><HotTopicsPage /></ProtectedRoute>} />
          <Route path="/article" element={<ProtectedRoute><ArticlePage /></ProtectedRoute>} />
          <Route path="/todo" element={<ProtectedRoute><ActionsPage /></ProtectedRoute>} />
          <Route path="/actions" element={<ProtectedRoute><ActionsPage /></ProtectedRoute>} />
          <Route path="/log" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          <Route path="/me" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path="/growth" element={<ProtectedRoute><GrowthPage /></ProtectedRoute>} />
          <Route path="/marks" element={<ProtectedRoute><MarksPage /></ProtectedRoute>} />
          <Route path="/collections" element={<ProtectedRoute><CollectionsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/history-logs" element={<ProtectedRoute><HistoryLogsPage /></ProtectedRoute>} />
          <Route path="/history-brief" element={<ProtectedRoute><HistoryBriefPage /></ProtectedRoute>} />
          <Route path="/weekly-report" element={<ProtectedRoute><WeeklyReportPage /></ProtectedRoute>} />
          <Route path="/monthly-report" element={<ProtectedRoute><MonthlyReportPage /></ProtectedRoute>} />
          <Route path="/annual-report" element={<ProtectedRoute><AnnualReportPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/notification-settings" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
          <Route path="/help-feedback" element={<ProtectedRoute><HelpFeedbackPage /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
          <Route path="/design-preview" element={<DesignPreviewPage />} />
          <Route path="/style-config" element={<StylePreviewPage />} />
          <Route path="/decor-preview" element={<DecorPreviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
