import React, { useState, useEffect } from 'react';
import { SvgIcon } from '../SvgIcon/SvgIcon';
import './CardButton.css';

const CARD_TRANSITION_MS = 750;

export interface CardButtonProps {
  /** Card title when collapsed (e.g. "Mouse Travel") */
  title: string;
  /** Value shown under the title when collapsed */
  value: string | number;
  iconName: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  /** Content shown when card is expanded */
  children?: React.ReactNode;
  className?: string;
  /** Title shown in the expanded card header (defaults to title) */
  expandedTitle?: string;
  /** Optional description or subtitle in the expanded header */
  headerDescription?: string;
  /** Optional action(s) in the expanded header (e.g. "Change" button) */
  headerActions?: React.ReactNode;
  /** When true and card is open, no expand/collapse transition (e.g. when returning from another flow) */
  openWithoutTransition?: boolean;
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
  expandedTitle,
  headerDescription,
  headerActions,
  openWithoutTransition = false
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (openWithoutTransition) return;
    setIsTransitioning(true);
    const t = setTimeout(() => setIsTransitioning(false), CARD_TRANSITION_MS);
    return () => clearTimeout(t);
  }, [isOpen, openWithoutTransition]);

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
        className={`card-button ${isOpen ? 'card-open' : ''} ${isTransitioning ? 'is-changing' : ''} ${isOpen && openWithoutTransition ? 'card-open-no-transition' : ''} ${className}`}
        onClick={handleCardClick}
      >
        <div className="card-header">
          <h4>{title}</h4>
          <button className="btn-icon">
            <SvgIcon name={iconName} />
          </button>
        </div>

        <div className="card-wrapper" onClick={e => e.stopPropagation()}>
          {isOpen && (
            <>
              <div className="card-header">
                <div className="card-header-content">
                  <h4>{expandedTitle ?? title}</h4>
                  {headerDescription && <p>{headerDescription}</p>}
                </div>
                {headerActions}
                <button className="btn-icon btn-close" onClick={onClose} type="button">
                  <SvgIcon name="close" />
                </button>
              </div>
              <div className="card-content">
                {children}
              </div>
            </>
          )}
        </div>

        <p>{value}</p>
      </div>
    </>
  );
};
