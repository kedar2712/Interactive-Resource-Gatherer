
import React from 'react';
import { EventLogEntry } from '../types';

interface EventLogProps {
  entries: EventLogEntry[];
}

const EventLog: React.FC<EventLogProps> = ({ entries }) => {
  const typeClasses = {
    'score-plus': 'bg-success/10 border-l-4 border-success',
    'cost-minus': 'bg-danger/10 border-l-4 border-danger',
    'action-info': 'bg-warning/10 border-l-4 border-warning',
    'target-reached': 'bg-target/10 border-l-4 border-target',
  };

  return (
    <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h2 className="text-center text-xl font-semibold text-text-color m-0">Event Log (Reward Matrix)</h2>
        </div>
        <div className="bg-secondary-fill text-sm p-6 rounded-2xl border-2 border-secondary-border min-h-[300px] h-[50vh] max-h-[600px] overflow-y-auto flex flex-col-reverse">
            <div className="flex flex-col gap-2">
                {entries.map((entry, index) => (
                    <div
                    key={entry.id || index}
                    className={`flex items-center gap-3 p-2 rounded-md animate-fadeIn ${typeClasses[entry.type]}`}
                    >
                    <span>{entry.icon}</span>
                    <span dangerouslySetInnerHTML={{ __html: entry.message }} />
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default EventLog;
