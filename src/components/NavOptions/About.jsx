import '../NavOptions/InfoPages.css';

export default function About() {
    return (
        <div className="info-page-container">
            <div className="info-page-wrapper">
                <div className="info-header">
                    <h1>About Us</h1>
                    <p className="info-subtitle">Revolutionizing Urban Parking</p>
                </div>

                <div className="info-content">
                    <section className="info-section">
                        <h2>Our Mission</h2>
                        <p>To transform the stressful process of urban parking into a seamless, predictable, and transparent experience, giving drivers back their time and reducing city congestion.</p>
                    </section>

                    <section className="info-section">
                        <h2>The Parkway Story</h2>
                        <p>We started Parkway because we were tired of the "parking panic"—the frustration of circling crowded blocks, the surprise fees, and the unnecessary fuel waste. We realized that with modern technology, finding parking shouldn't be a gamble; it should be an expectation. Parkway was founded on the belief that better data leads to better decisions, and we built a solution that puts real-time parking information right in the palm of your hand.</p>
                    </section>

                    <section className="info-section">
                        <h2>Our Core Values</h2>
                        <ul className="values-list">
                            <li>
                                <span className="value-icon">⚡</span>
                                <div>
                                    <strong>Efficiency:</strong> Maximizing time saved for every driver.
                                </div>
                            </li>
                            <li>
                                <span className="value-icon">🔓</span>
                                <div>
                                    <strong>Transparency:</strong> No hidden fees, ever. Clear pricing and availability guaranteed.
                                </div>
                            </li>
                            <li>
                                <span className="value-icon">✓</span>
                                <div>
                                    <strong>Reliability:</strong> Providing accurate, real-time data you can trust.
                                </div>
                            </li>
                            <li>
                                <span className="value-icon">💡</span>
                                <div>
                                    <strong>Innovation:</strong> Constantly refining our technology to adapt to new urban environments.
                                </div>
                            </li>
                        </ul>
                    </section>

                    <section className="info-section">
                        <h2>What Makes Parkway Unique?</h2>
                        <p>While other apps show parking locations, Parkway shows real-time slot availability and allows for direct reservation. We are the only solution that guarantees you know the price and secure your spot before you leave for your destination.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}