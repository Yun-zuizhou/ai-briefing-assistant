import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppProvider } from './context/AppContext';
import { useAppContext } from './context/useAppContext';

const TodayPage = lazy(() => import('./pages/TodayPage'));
const ActionsPage = lazy(() => import('./pages/ActionsPage'));
const JournalPage = lazy(() => import('./pages/JournalPage'));
const GrowthPage = lazy(() => import('./pages/GrowthPage'));
const MyPage = lazy(() => import('./pages/MyPage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HistoryLogsPage = lazy(() => import('./pages/HistoryLogsPage'));
const HistoryBriefPage = lazy(() => import('./pages/HistoryBriefPage'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const InterestConfigPage = lazy(() => import('./pages/InterestConfigPage'));
const PreviewPage = lazy(() => import('./pages/PreviewPage'));
const WeeklyReportPage = lazy(() => import('./pages/WeeklyReportPage'));
const MonthlyReportPage = lazy(() => import('./pages/MonthlyReportPage'));
const AnnualReportPage = lazy(() => import('./pages/AnnualReportPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const HotTopicsPage = lazy(() => import('./pages/HotTopicsPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AiProviderSettingsPage = lazy(() => import('./pages/AiProviderSettingsPage'));
const NotificationSettingsPage = lazy(() => import('./pages/NotificationSettingsPage'));
const HelpFeedbackPage = lazy(() => import('./pages/HelpFeedbackPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AiDigestLabPage = lazy(() => import('./pages/AiDigestLabPage'));

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
  const { user, authResolved } = useAppContext();
  if (!authResolved) {
    return <RouteFallback />;
  }
  if (!user.isLoggedIn) {
    return <Navigate to="/welcome" replace />;
  }
  return <>{children}</>;
}

function RootRoute() {
  const { user, authResolved } = useAppContext();
  if (!authResolved) {
    return <RouteFallback />;
  }
  return <Navigate to={user.isLoggedIn ? '/today' : '/welcome'} replace />;
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
          <Route path="/preview" element={<PreviewPage />} />
          <Route path="/" element={<RootRoute />} />
          <Route path="/today" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/hot-topics" element={<ProtectedRoute><HotTopicsPage /></ProtectedRoute>} />
          <Route path="/article" element={<ProtectedRoute><ArticlePage /></ProtectedRoute>} />
          <Route path="/todo" element={<ProtectedRoute><ActionsPage /></ProtectedRoute>} />
          <Route path="/actions" element={<ProtectedRoute><ActionsPage /></ProtectedRoute>} />
          <Route path="/log" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
          <Route path="/me" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path="/growth" element={<ProtectedRoute><GrowthPage /></ProtectedRoute>} />
          <Route path="/collections" element={<ProtectedRoute><CollectionsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/history-logs" element={<ProtectedRoute><HistoryLogsPage /></ProtectedRoute>} />
          <Route path="/history-brief" element={<ProtectedRoute><HistoryBriefPage /></ProtectedRoute>} />
          <Route path="/weekly-report" element={<ProtectedRoute><WeeklyReportPage /></ProtectedRoute>} />
          <Route path="/monthly-report" element={<ProtectedRoute><MonthlyReportPage /></ProtectedRoute>} />
          <Route path="/annual-report" element={<ProtectedRoute><AnnualReportPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/ai-provider-settings" element={<ProtectedRoute><AiProviderSettingsPage /></ProtectedRoute>} />
          <Route path="/notification-settings" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
          <Route path="/help-feedback" element={<ProtectedRoute><HelpFeedbackPage /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
          <Route path="/ai-digest-lab" element={<ProtectedRoute><AiDigestLabPage /></ProtectedRoute>} />
          <Route path="*" element={<RootRoute />} />
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
