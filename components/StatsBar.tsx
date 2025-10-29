
import React from 'react';

interface StatsBarProps {
  score: number;
  targetScore: number;
  highScore: number;
  costBudget: number;
  stepCost: number;
}

const Stat: React.FC<{ label: string; value: number; colorClass?: string }> = ({ label, value, colorClass = 'text-accent' }) => (
  <div className="text-center">
    <span className="block text-xs sm:text-sm text-text-muted">{label}</span>
    <span className={`block text-xl sm:text-2xl font-semibold ${colorClass}`}>{value}</span>
  </div>
);

const StatsBar: React.FC<StatsBarProps> = ({ score, targetScore, highScore, costBudget, stepCost }) => {
  const costPercentage = Math.min((stepCost / costBudget) * 100, 100);

  return (
    <div className="w-full">
      <div className="w-full grid grid-cols-5 gap-2 sm:gap-4 bg-white p-4 rounded-xl border border-primary-border text-center">
        <Stat label="Score" value={score} />
        <Stat label="Target Score" value={targetScore} colorClass="text-target" />
        <Stat label="High Score" value={highScore} colorClass="text-warning" />
        <Stat label="Cost Budget" value={costBudget} />
        <Stat label="Cost (Steps)" value={stepCost} />
      </div>
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mt-2">
        <div 
          className="bg-accent h-full rounded-full transition-all duration-200 ease-out" 
          style={{ width: `${costPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default StatsBar;
