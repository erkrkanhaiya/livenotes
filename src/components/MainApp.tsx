import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from './LoginScreen';
import NotesApp from './NotesApp';
import LoadingSpinner from './LoadingSpinner';
import InstallPrompt from './InstallPrompt';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <>
        <LoginScreen />
        <InstallPrompt />
      </>
    );
  }

  return (
    <>
      <NotesApp />
      <InstallPrompt />
    </>
  );
};

export default MainApp;