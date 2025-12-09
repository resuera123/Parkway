import React from 'react';
import '../styles/Dashboard.css';
import { BiQuestionMark } from "react-icons/bi"; // <--- 1. Import the icon

const AskModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay" style={{ zIndex: 3100 }}>
      <div className="custom-modal-content">
        <div className="modal-icon-ask">
          {/* 2. Replace the <i> tag with this component */}
          <BiQuestionMark />
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        
        <div className="modal-actions">
          <button 
            className="modal-btn cancel" 
            onClick={onClose}
            disabled={isLoading}
          >
            No, Cancel
          </button>
          <button 
            className="modal-btn confirm-teal" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Yes, Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AskModal;