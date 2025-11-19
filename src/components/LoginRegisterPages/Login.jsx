import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { BsBusFrontFill } from "react-icons/bs";

export default function Login() {
    const [open, setOpen] = useState(false);

    return (
        <div>
            <div className="center-wrapper">
                <div className="wrapper">
                    <form>
                    <div className="logo-login">
                        <BsBusFrontFill className="logo-icon" />
                        <h1>&nbsp;ParkWay</h1>
                    </div>

                    <div className="input-box">
                        <input type="text" placeholder="Username" required />
                        <i className="bx bx-user"></i>
                    </div>

                    <div className="input-box">
                        <input type="password" placeholder="Password" required />
                        <i className="bx bx-lock"></i>
                    </div>

                    <button type="submit" className="login_btn">
                        Login
                    </button>

                    <div className="register-link">
                        <p>
                        Don't have an account? <Link to="/register">Register</Link>
                        </p>
                    </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
