import { BsBusFrontFill } from "react-icons/bs";
import { Link } from "react-router-dom";

export default function NavBar() {
    return (
        <div>
            {/* HEADER */}
            <header>
                <div className="navbar">

                    <Link to="/"><BsBusFrontFill className="logo-icon" /></Link>

                    <ul className="links">
                        <li><Link to="/about">About</Link></li>
                        <li><Link to="/services">Services</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                        <li><Link to="/register" className="action_btn">Get Started</Link></li>
                    </ul>

                    
                </div>
            </header>
        </div>
    );
}