
import React from 'react';

interface FocusModalProps {
  isVisible: boolean;
  onStart: () => void;
  finalScore?: number;
}

const FocusModal: React.FC<FocusModalProps> = ({ isVisible, onStart, finalScore }) => {
  if (!isVisible) return null;

  const isEndGame = finalScore !== undefined;

  return (
    <div
      className="absolute inset-0 flex flex-col justify-center items-center bg-primary-fill/95 text-text-color p-4 text-center z-10 rounded-lg cursor-pointer transition-opacity duration-300"
      onClick={!isEndGame ? onStart : undefined}
    >
      <div className="text-2xl font-semibold">
        {isEndGame ? 'Budget Reached!' : 'Click to Begin'}
      </div>
      <div className="text-base mt-2">
        {isEndGame 
          ? `Final Score: ${finalScore}. New game starting soon...` 
          : '(This will enable audio)'}
      </div>
    </div>
  );
};

export default FocusModal;
