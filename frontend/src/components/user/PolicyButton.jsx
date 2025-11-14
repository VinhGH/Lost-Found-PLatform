import React, { useState } from 'react';
import PolicyModal from './PolicyModal';
import { Description as DescriptionIcon } from '@mui/icons-material';
import './PolicyModal.css';

const PolicyButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        className="policy-button"
        onClick={() => setIsModalOpen(true)}
        aria-label="Xem chính sách và quy định"
      >
        <DescriptionIcon className="policy-icon" />
        <span>Chính sách & Quy định</span>
      </button>

      {isModalOpen && (
        <PolicyModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default PolicyButton;

