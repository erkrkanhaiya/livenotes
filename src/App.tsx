import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotesProvider } from './contexts/NotesContext';
import MainApp from './components/MainApp';
import SharedNoteView from './components/SharedNoteView';
import PrivacyPolicy from './components/PrivacyPolicy';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes - no authentication required */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/share/:shareId" element={<SharedNoteView />} />
            
            {/* Main app route - requires NotesProvider */}
            <Route 
              path="/*" 
              element={
                <NotesProvider>
                  <MainApp />
                </NotesProvider>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
