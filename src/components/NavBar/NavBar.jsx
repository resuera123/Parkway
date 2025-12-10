import { BsBusFrontFill } from "react-icons/bs";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import '../NavBar/NavBar.css';

export default function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const storedUser = user || (() => {
        try {
            return JSON.parse(localStorage.getItem('currentUser'));
        } catch {
            return null;
        }
    })();

    const isAuthPage = location.pathname === '/' || location.pathname === '/register';
    const isDashboard = location.pathname === '/dashboard';
    const isAdminDashboard = location.pathname === '/admin';
    const isInfoPage = location.pathname === '/about' || location.pathname === '/services' || location.pathname === '/contact';

    if (isAuthPage || isDashboard || isAdminDashboard) {
        return null;
    }

    if (isInfoPage) {
        const backTarget = storedUser?.role === 'admin' ? '/admin' : '/dashboard';
        return (
            <div>
                <header>
                    <div className="navbar info-navbar">
                        <div className="navbar-brand">
                            <BsBusFrontFill className="logo-icon" />
                            <span className="brand-name">PARKWAY{storedUser?.role === 'admin' ? ' ADMIN' : ''}</span>
                        </div>

                        <ul className="links">
                            <li><Link to="/about">About</Link></li>
                            <li><Link to="/services">Services</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>

                        <button
                            className="creative-back-btn"
                            onClick={() => navigate(backTarget)}
                        >
                            <span className="back-icon">←</span>
                            <span className="back-text">{storedUser?.role === 'admin' ? 'Admin' : 'Dashboard'}</span>
                        </button>
                    </div>
                </header>
            </div>
        );
    }

    return null;
}