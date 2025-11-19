import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const register = (userData) => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userExists = users.find(u => u.username === userData.username || u.email === userData.email);
    
    if (userExists) {
      return { success: false, message: 'User already exists' };
    }
    
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    return { success: true, message: 'Registration successful' };
  };

  const login = (username, password) => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      return { success: true, message: 'Login successful' };
    }
    
    return { success: false, message: 'Invalid username or password' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
