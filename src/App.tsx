import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotesProvider } from './contexts/NotesContext';
import MainApp from './components/MainApp';
import SharedNoteView from './components/SharedNoteView';
import PrivacyPolicy from './components/PrivacyPolicy';
import ResetPasswordPage from './components/ResetPasswordPage';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotesProvider>
          <Router>
            <Routes>
              {/* Public routes - no authentication required */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/share/:shareId" element={<SharedNoteView />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Main app route */}
              <Route path="/*" element={<MainApp />} />
            </Routes>
          </Router>
        </NotesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
