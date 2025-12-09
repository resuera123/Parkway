import React from 'react';
import '../styles/Dashboard.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-content">
        <div className="modal-icon-warning">
          <i className='bx bx-trash'></i>
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        
        <div className="modal-actions">
          <button 
            className="modal-btn cancel" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="modal-btn confirm" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Yes, Delete It'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;