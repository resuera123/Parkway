import { Link } from "react-router-dom";

export default function Register() {
    return (
        <div>
            <div className="center-wrapper register-wrapper">
                <div className="wrapper">
                    <form>
                        <h1>Create an Account!</h1>

                        <div className="input-box">
                            <input type="text" placeholder="Username" required />
                            <i className="bx bx-user"></i>
                        </div>

                        <div className="input-box">
                            <input type="text" placeholder="First Name" required />
                            <i className="bx bx-id-card"></i>
                        </div>

                        <div className="input-box">
                            <input type="text" placeholder="M.I." maxLength="1" required />
                            <i className="bx bx-id-card"></i>
                        </div>

                        <div className="input-box">
                            <input type="text" placeholder="Last Name" required />
                            <i className="bx bx-id-card"></i>
                        </div>

                        <div className="input-box">
                            <input type="email" placeholder="Email" required />
                            <i className="bx bx-envelope"></i>
                        </div>

                        <div className="input-box">
                            <input type="password" placeholder="Password" required />
                            <i className="bx bx-lock"></i>
                        </div>

                        <div className="input-box">
                            <input type="password" placeholder="Confirm Password" required />
                            <i className="bx bx-lock"></i>
                        </div>

                        <button type="submit" className="login_btn">
                            Register
                        </button>

                        <div className="register-link">
                            <p>
                                Already have an account? <Link to="/">Login</Link>
                            </p>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}