import React from 'react';

interface ControlsProps {
  costBudget: number;
  onCostBudgetChange: (value: number) => void;
  onRestart: () => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  isBotRunning: boolean;
  onRunBot: () => void;
}

const Controls: React.FC<ControlsProps> = ({ costBudget, onCostBudgetChange, onRestart, isMuted, onMuteToggle, isBotRunning, onRunBot }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 sm:gap-6 flex-wrap justify-center">
        <div className="flex items-center gap-2">
          <label htmlFor="cost-budget-input" className="font-semibold text-sm sm:text-base">Set Cost Budget:</label>
          <input
            type="number"
            id="cost-budget-input"
            value={costBudget}
            min="50"
            max="1000"
            step="10"
            onChange={(e) => onCostBudgetChange(Number(e.target.value))}
            className="w-20 p-2 rounded-md border border-gray-300 bg-white text-text-color font-sans text-center"
            disabled={isBotRunning}
          />
        </div>
        <button
          onClick={onRestart}
          disabled={isBotRunning}
          className="py-2 px-5 font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 bg-accent text-white hover:bg-blue-500 active:scale-95 shadow-accent/50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          🚀 Start New Game
        </button>
        <button
          onClick={onRunBot}
          disabled={isBotRunning}
          className="py-2 px-5 font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 bg-tertiary-border text-white hover:bg-tertiary-border/80 active:scale-95 shadow-tertiary-border/50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isBotRunning ? '🤖 Bot Running...' : '🤖 Run Bot (100 Games)'}
        </button>
        <button
          onClick={onMuteToggle}
          className="py-2 px-4 font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 bg-white text-text-color border border-gray-300 hover:bg-gray-100 active:scale-95"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
};

export default Controls;