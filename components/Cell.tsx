
import React from 'react';
import { Resource } from '../types';

interface CellProps {
  resource?: Resource;
  isMud: boolean;
  isBase: boolean;
  isAgent: boolean;
  isHolding: boolean;
  holdingType?: 'normal' | 'golden';
  goalPointerAngle: number;
  isPath: boolean;
  onResourceHover: (resource: Resource | null) => void;
}

const Cell: React.FC<CellProps> = React.memo(({
  resource,
  isMud,
  isBase,
  isAgent,
  isHolding,
  holdingType,
  goalPointerAngle,
  isPath,
  onResourceHover,
}) => {
  const cellClasses = [
    'relative w-full h-full flex justify-center items-center border-r border-b border-grid-cell-border box-border transition-colors duration-200',
    isMud ? 'bg-mud' : '',
    isHolding && holdingType === 'normal' ? 'bg-warning/20 rounded-full' : '',
    isHolding && holdingType === 'golden' ? 'bg-warning/30 rounded-full' : '',
    resource ? 'cursor-pointer' : 'cursor-default',
  ].join(' ');

  return (
    <div
      className={cellClasses}
      onMouseEnter={() => onResourceHover(resource || null)}
    >
      <div className={`absolute inset-0 bg-accent/40 transition-opacity duration-200 z-[1] ${isPath ? 'opacity-100' : 'opacity-0'}`} />
      
      <span className="absolute z-[2] text-3xl pointer-events-none">
        {isBase && '🏠'}
        {resource?.type === 'normal' && '🌳'}
        {resource?.type === 'golden' && '🌟'}
      </span>
      
      {isAgent && (
        <>
           {isHolding && (
            <span 
              className="absolute text-lg opacity-80 transition-transform duration-300 z-[3] pointer-events-none"
              style={{ transform: `rotate(${goalPointerAngle}deg)` }}
            >
              ➤
            </span>
          )}
          <span className="absolute z-[2] text-3xl transition-transform duration-150 ease-out pointer-events-none">
            🚶
          </span>
        </>
      )}
    </div>
  );
});

export default Cell;
