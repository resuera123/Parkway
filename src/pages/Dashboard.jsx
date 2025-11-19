import React from 'react';
import '../styles/Dashboard.css';

export default function Dashboard() {
  return (
    <>
      <nav className="navbar">
        <div className="logo">ParkWay</div>
        <ul className="nav-links">
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#bookings">Bookings</a></li>
          <li><a href="#payments">Payments</a></li>
          <li><a href="#settings">Settings</a></li>
        </ul>
        <div className="user-menu">
          <div className="user-avatar">U</div>
          <span>Welcome User</span>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="header">
          <h1>Find Your Spot</h1>
          <p>Reserve & Manage Your Parking Spaces</p>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <div className="card-icon">🚗</div>
            <h2>Active Bookings</h2>
            <p>Your current reservations</p>
            <div className="card-value">2</div>
            <button className="btn">View Details →</button>
          </div>

          <div className="card">
            <div className="card-icon">💳</div>
            <h2>Wallet Balance</h2>
            <p>Available balance</p>
            <div className="card-value">$45.50</div>
            <button className="btn">Add Funds →</button>
          </div>

          <div className="card">
            <div className="card-icon">⭐</div>
            <h2>Your Rating</h2>
            <p>Based on your bookings</p>
            <div className="card-value">4.8</div>
            <button className="btn">View Reviews →</button>
          </div>
        </div>

        <div className="activity-section">
          <h2>Recent Activity</h2>
          <div className="activity-item">
            <div>
              <strong>Parking Session Completed</strong>
              <p>Downtown Garage - 2 hours</p>
            </div>
            <div className="activity-time">Today, 3:45 PM</div>
          </div>
          <div className="activity-item">
            <div>
              <strong>Payment Received</strong>
              <p>Refund for unused time</p>
            </div>
            <div className="activity-time">Yesterday, 10:20 AM</div>
          </div>
          <div className="activity-item">
            <div>
              <strong>New Booking Created</strong>
              <p>Airport Parking - Next week</p>
            </div>
            <div className="activity-time">2 days ago</div>
          </div>
        </div>
      </div>
    </>
  );
}
