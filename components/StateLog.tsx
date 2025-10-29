
import React from 'react';
import { LogEntry } from '../types';

interface StateLogProps {
  logData: LogEntry[];
  onDownload: () => void;
  onClear: () => void;
}

const StateLog: React.FC<StateLogProps> = ({ logData, onDownload, onClear }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-text-color m-0">State-Action Logs</h2>
        <div className="flex gap-2">
          <button onClick={onDownload} className="py-2 px-3 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 bg-white text-text-color border border-secondary-border hover:bg-secondary-border hover:text-white active:scale-95">
            Download CSV
          </button>
          <button onClick={onClear} className="py-2 px-3 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 bg-danger text-white border-none hover:bg-red-400 active:scale-95">
            Clear
          </button>
        </div>
      </div>
      <div className="bg-secondary-fill text-xs p-6 rounded-2xl border-2 border-secondary-border min-h-[300px] h-[50vh] max-h-[600px] overflow-y-auto font-mono whitespace-pre-wrap word-wrap break-word">
        {logData.length > 0 ? JSON.stringify(logData.slice(-100), null, 2) : "No log data yet. Play the game to generate logs."}
      </div>
    </div>
  );
};

export default StateLog;
