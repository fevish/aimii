import React, { useState, useEffect } from 'react';
import { SvgIcon } from '../SvgIcon/SvgIcon';
import './CardButton.css';

const CARD_TRANSITION_MS = 750;

interface CardButtonProps {
  title: string;
  value: string | number;
  iconName: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children?: React.ReactNode;
  className?: string;
  contentTitle?: string;
}

export const CardButton: React.FC<CardButtonProps> = ({
  title,
  value,
  iconName,
  isOpen,
  onToggle,
  onClose,
  children,
  className = '',
  contentTitle
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const t = setTimeout(() => setIsTransitioning(false), CARD_TRANSITION_MS);
    return () => clearTimeout(t);
  }, [isOpen]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (isOpen) {
      onClose();
    } else {
      onToggle();
    }
  };

  return (
    <>
      {/* Backdrop for click outside when card is open */}
      {isOpen && (
        <div
          className="card-backdrop"
          onClick={onClose}
        />
      )}

      <div
        className={`card-button ${isOpen ? 'card-open' : ''} ${isTransitioning ? 'is-changing' : ''} ${className}`}
        onClick={handleCardClick}
      >
        <div className="card-header">
          <h4>{title}</h4>
          <button className="btn-icon">
            <SvgIcon name={iconName} />
          </button>
        </div>

        <div className="card-content" onClick={e => e.stopPropagation()}>
          {isOpen && (
            <>
              <div className="card-header">
                <h4>{contentTitle || title}</h4>
                <button className="btn-icon btn-close" onClick={onClose}>
                  <SvgIcon name="close" />
                </button>
              </div>
              {children}
            </>
          )}
        </div>

        <p>{value}</p>
      </div>
    </>
  );
};
