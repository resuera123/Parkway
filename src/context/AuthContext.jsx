import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser')) || null; } catch { return null; }
  });

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      // Keep any existing role (admin or user) – do not overwrite
      const userObj = { ...foundUser };
      localStorage.setItem('currentUser', JSON.stringify(userObj));
      setUser(userObj);
      return { success: true, user: userObj };
    }
    return { success: false, message: 'Invalid username or password' };
  };

  const register = (userData) => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.username === userData.username)) {
      return { success: false, message: 'Username already exists' };
    }
    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: 'Email already registered' };
    }
    users.push(userData); // role intentionally omitted until first login choice
    localStorage.setItem('users', JSON.stringify(users));
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
