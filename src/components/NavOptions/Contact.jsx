import citlogo from '../../images/citlogo.png';
import '../NavOptions/InfoPages.css';

export default function Contact() {
    return (
        <div className="info-page-container">
            <div className="info-page-wrapper">
                <div className="info-header">
                    <h1>Contact Us</h1>
                    <p className="info-subtitle">Get in touch with our team</p>
                </div>

                <div className="info-content">
                    <section className="contact-section">
                        <div className="contact-card">
                            <img 
                                src={citlogo} 
                                alt="CIT LOGO" 
                                className="contact-logo"
                            />
                            <h2>Cebu Institute of Technology University</h2>
                            <p className="contact-subtitle">Project Partners</p>
                        </div>

                        <div className="contact-emails">
                            <h3>Email Us</h3>
                            <div className="emails-list">
                                <a href="mailto:jefferus.resuera@cit.edu" className="email-link">
                                    📧 jefferus.resuera@cit.edu
                                </a>
                                <a href="mailto:junjie.geraldez@cit.edu" className="email-link">
                                    📧 junjie.geraldez@cit.edu
                                </a>
                                <a href="mailto:josan.sumarago@cit.edu" className="email-link">
                                    📧 josan.sumarago@cit.edu
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}