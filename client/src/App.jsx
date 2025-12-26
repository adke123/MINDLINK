import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';

// Senior Pages
import SeniorLayout from './components/layout/SeniorLayout';
import SeniorHomePage from './pages/senior/SeniorHomePage';
import SeniorChatPage from './pages/senior/SeniorChatPage';
import SeniorGamesPage from './pages/senior/SeniorGamesPage';
import SeniorMemoryPage from './pages/senior/SeniorMemoryPage';
import SeniorLiveChatPage from './pages/senior/SeniorLiveChatPage';
import SeniorSettingsPage from './pages/senior/SeniorSettingsPage';
import SeniorMedicationPage from './pages/senior/SeniorMedicationPage';
import SeniorSchedulePage from './pages/senior/SeniorSchedulePage';

// Guardian Pages
import GuardianLayout from './components/layout/GuardianLayout';
import GuardianDashboardPage from './pages/guardian/GuardianDashboardPage';
import GuardianEmotionPage from './pages/guardian/GuardianEmotionPage';
import GuardianConversationsPage from './pages/guardian/GuardianConversationsPage';
import GuardianGamesPage from './pages/guardian/GuardianGamesPage';
import GuardianMemoryPage from './pages/guardian/GuardianMemoryPage';
import GuardianLiveChatPage from './pages/guardian/GuardianLiveChatPage';
import GuardianConnectPage from './pages/guardian/GuardianConnectPage';
import GuardianSettingsPage from './pages/guardian/GuardianSettingsPage';
import GuardianReportPage from './pages/guardian/GuardianReportPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, profile } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && profile?.role !== allowedRole) {
    return <Navigate to={profile?.role === 'senior' ? '/senior' : '/guardian'} replace />;
  }
  
  return children;
};

function App() {
  const { isAuthenticated, profile } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? 
            <Navigate to={profile?.role === 'senior' ? '/senior' : '/guardian'} replace /> : 
            <LoginPage />
        } />
        <Route path="/signup" element={
          isAuthenticated ? 
            <Navigate to={profile?.role === 'senior' ? '/senior' : '/guardian'} replace /> : 
            <SignUpPage />
        } />

        {/* Senior Routes */}
        <Route path="/senior" element={
          <ProtectedRoute allowedRole="senior">
            <SeniorLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SeniorHomePage />} />
          <Route path="chat" element={<SeniorChatPage />} />
          <Route path="games" element={<SeniorGamesPage />} />
          <Route path="memory" element={<SeniorMemoryPage />} />
          <Route path="live-chat" element={<SeniorLiveChatPage />} />
          <Route path="settings" element={<SeniorSettingsPage />} />
          <Route path="medication" element={<SeniorMedicationPage />} />
          <Route path="schedule" element={<SeniorSchedulePage />} />
        </Route>

        {/* Guardian Routes */}
        <Route path="/guardian" element={
          <ProtectedRoute allowedRole="guardian">
            <GuardianLayout />
          </ProtectedRoute>
        }>
          <Route index element={<GuardianDashboardPage />} />
          <Route path="emotion" element={<GuardianEmotionPage />} />
          <Route path="conversations" element={<GuardianConversationsPage />} />
          <Route path="games" element={<GuardianGamesPage />} />
          <Route path="memory" element={<GuardianMemoryPage />} />
          <Route path="live-chat" element={<GuardianLiveChatPage />} />
          <Route path="connect" element={<GuardianConnectPage />} />
          <Route path="settings" element={<GuardianSettingsPage />} />
          <Route path="report" element={<GuardianReportPage />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={
          isAuthenticated ? 
            <Navigate to={profile?.role === 'senior' ? '/senior' : '/guardian'} replace /> : 
            <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
