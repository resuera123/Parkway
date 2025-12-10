import React from 'react';
import '../styles/Dashboard.css'; 

const SuccessModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay" style={{ zIndex: 3000 }}>
      <div className="custom-modal-content">
        <div className="modal-icon-success">
          {/* Boxicons Checkmark */}
          <i className='bx bx-check-circle'></i>
        </div>
        <h3>{title || "Success!"}</h3>
        <p>{message || "Action completed successfully."}</p>
        
        <div className="modal-actions">
          <button 
            className="modal-btn success-btn" 
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;