import '../NavOptions/InfoPages.css';

export default function Services() {
    const services = [
        {
            icon: '🔍',
            title: 'Real-Time Availability',
            description: 'Check live parking slot availability across multiple locations in your area.'
        },
        {
            icon: '🎯',
            title: 'Easy Reservations',
            description: 'Reserve your parking spot in advance and guarantee your space.'
        },
        {
            icon: '💰',
            title: 'Transparent Pricing',
            description: 'Know the exact cost before you book. No hidden fees, ever.'
        },
        {
            icon: '📍',
            title: 'Navigation Support',
            description: 'Get turn-by-turn directions to your reserved parking spot.'
        },
        {
            icon: '🔔',
            title: 'Smart Notifications',
            description: 'Receive alerts about your parking sessions and special offers.'
        },
        {
            icon: '⭐',
            title: 'User Ratings',
            description: 'Read reviews from other drivers about parking facilities.'
        }
    ];

    return (
        <div className="info-page-container">
            <div className="info-page-wrapper">
                <div className="info-header">
                    <h1>Our Services</h1>
                    <p className="info-subtitle">Everything you need for hassle-free parking</p>
                </div>

                <div className="info-content">
                    <div className="services-grid">
                        {services.map((service, index) => (
                            <div key={index} className="service-card">
                                <div className="service-icon">{service.icon}</div>
                                <h3>{service.title}</h3>
                                <p>{service.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}