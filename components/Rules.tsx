import React from 'react';
import { GOLDEN_TREE_VALUE, NORMAL_TREE_VALUE } from '../constants';

const RuleItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="text-sm text-text-muted">{children}</li>
);

const Rules: React.FC = () => {
  return (
    <div className="w-full bg-tertiary-fill p-4 sm:p-6 rounded-xl border-2 border-tertiary-border">
      <h2 className="text-center mt-0 mb-4 text-text-color text-lg font-semibold">Game Rules</h2>
      <ul className="list-none p-0 m-0 grid gap-x-6 gap-y-2 grid-cols-1 sm:grid-cols-2">
        <RuleItem><strong>Goal:</strong> Beat the <strong>Target Score</strong> within the budget.</RuleItem>
        <RuleItem><strong>Normal Tree (🌳):</strong> Delivers <strong>+{NORMAL_TREE_VALUE}</strong> score.</RuleItem>
        <RuleItem><strong>Path Preview:</strong> Hover over a resource to see the path and its cost.</RuleItem>
        <RuleItem><strong>Golden Tree (🌟):</strong> Delivers <strong>+{GOLDEN_TREE_VALUE}</strong> score.</RuleItem>
        <RuleItem><strong>Goal Pointer:</strong> An arrow points to the base when holding a resource.</RuleItem>
        <RuleItem><strong>Grass Tile:</strong> Movement costs <strong>1</strong> step.</RuleItem>
        <RuleItem><strong>Mud Tile (Brown):</strong> Movement costs <strong>3</strong> steps.</RuleItem>
      </ul>
    </div>
  );
};

export default Rules;