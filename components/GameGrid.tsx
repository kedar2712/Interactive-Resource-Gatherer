
import React from 'react';
import { GameState, Position, Resource } from '../types';
import { GRID_SIZE, CELL_SIZE_PX } from '../constants';
import Cell from './Cell';

interface GameGridProps {
  gameState: GameState;
  onResourceHover: (resource: Resource | null) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  pathPreview: { path: Position[], cost: number };
  isGameActive: boolean;
}

const GameGrid: React.FC<GameGridProps> = ({ gameState, onResourceHover, onMouseMove, pathPreview, isGameActive }) => {
  const { agent, resources, mudPatches, base } = gameState;

  const cells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
    const y = Math.floor(i / GRID_SIZE);
    const x = i % GRID_SIZE;
    const posKey = `${x},${y}`;

    const resource = resources.find(r => r.x === x && r.y === y);
    const isMud = mudPatches.some(p => p.x === x && p.y === y);
    const isBase = base.x === x && base.y === y;
    const isAgent = agent.x === x && agent.y === y;
    // FIX: Ensure isHolding is a boolean by converting agent.holding to a boolean value.
    const isHolding = isAgent && !!agent.holding;
    const isPath = pathPreview.path.some(p => p.x === x && p.y === y);

    let angle = 0;
    if (isHolding) {
      angle = Math.atan2(base.y - agent.y, base.x - agent.x) * (180 / Math.PI);
    }
    
    return (
      <Cell
        key={posKey}
        resource={resource}
        isMud={isMud}
        isBase={isBase}
        isAgent={isAgent}
        isHolding={isHolding}
        holdingType={agent.holding?.type}
        goalPointerAngle={angle}
        isPath={isPath}
        onResourceHover={onResourceHover}
      />
    );
  });

  return (
    <div
      className="grid border-2 border-accent rounded-lg overflow-hidden bg-grid-bg shadow-lg"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE_PX}px)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE_PX}px)`,
      }}
      onMouseLeave={() => onResourceHover(null)}
      onMouseMove={onMouseMove}
    >
      {cells}
    </div>
  );
};

export default GameGrid;
