import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import NavBar from './components/NavBar/NavBar.jsx';
import Login from './components/LoginRegisterPages/Login.jsx';
import Register from './components/LoginRegisterPages/Register.jsx';
import Dashboard from './components/Dashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import Profile from './components/Profile.jsx';
import ParkingLocations from './components/ParkingLocations.jsx';
import About from './components/NavOptions/About.jsx';
import Services from './components/NavOptions/Services.jsx';
import Contact from './components/NavOptions/Contact.jsx';

function ProtectedRoute({ children, adminOnly }) {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  if (!currentUser) {
    return <Navigate to="/" />;
  }
  
  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar/>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/parking-locations" element={<ProtectedRoute><ParkingLocations /></ProtectedRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
