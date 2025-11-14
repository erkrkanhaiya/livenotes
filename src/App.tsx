import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotesProvider } from './contexts/NotesContext';
import MainApp from './components/MainApp';
import SharedNoteView from './components/SharedNoteView';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Shared note route - doesn't require NotesProvider */}
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
