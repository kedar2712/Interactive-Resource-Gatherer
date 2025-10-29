
import React from 'react';

interface EfficiencyDisplayProps {
  efficiency: number | 'infinity' | null;
}

const EfficiencyDisplay: React.FC<EfficiencyDisplayProps> = ({ efficiency }) => {
  const displayValue = () => {
    if (efficiency === null) {
      return <span className="text-text-muted">Hover over a resource...</span>;
    }
    if (efficiency === 'infinity') {
      return <span className="text-success font-bold">Infinite (On Resource)</span>;
    }
    return <span className="text-accent font-bold">{efficiency.toFixed(3)}</span>;
  };

  return (
    <div className="w-full bg-tertiary-fill p-4 sm:p-6 rounded-xl border-2 border-tertiary-border">
      <h2 className="text-center mt-0 mb-4 text-text-color text-lg font-semibold">Efficiency Preview</h2>
      <div className="text-center">
        <p className="text-sm text-text-muted m-0 mb-2">Efficiency = Value / (2 * Cost to Reach)</p>
        <p className="text-3xl font-recursive">{displayValue()}</p>
      </div>
    </div>
  );
};

export default EfficiencyDisplay;
