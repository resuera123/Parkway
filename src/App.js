import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import NavBar from './components/NavBar/NavBar.jsx';
import Login from './components/LoginRegisterPages/Login.jsx';
import Register from './components/LoginRegisterPages/Register.jsx';
import Dashboard from './components/Dashboard.jsx';
import Profile from './components/Profile.jsx';
import About from './components/NavOptions/About.jsx';
import Services from './components/NavOptions/Services.jsx';
import Contact from './components/NavOptions/Contact.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar/>

        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
