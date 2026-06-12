import React, { useState } from 'react';

import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  const handleLogin = async (userData) => {
    try {
      const res = await fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Unable to login or register user.');
      }

      const savedUser = await res.json();
      setUser({ ...savedUser, isAdmin: savedUser.role === 'ADMIN' });
      setShowAuth(false);
    } catch (error) {
      alert(error.message || 'Login failed.');
    }
  };

  if (user) {
    return <Dashboard user={user} setUser={setUser} />;
  }

  if (showAuth) {
    return <AuthPage onLogin={handleLogin} onBack={() => setShowAuth(false)} />;
  }

  return <LandingPage onGetStarted={() => setShowAuth(true)} />;
}

export default App;