
import { Position, AStarNode, PathResult } from '../types';
import { GRID_SIZE, GRASS_COST, MUD_COST } from '../constants';

const heuristic = (a: Position, b: Position): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

const reconstructPath = (node: AStarNode): Position[] => {
  const path: Position[] = [];
  let current: AStarNode | undefined = node;
  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }
  return path;
};

export const findPath = (start: Position, goal: Position, mudPatches: Position[]): PathResult => {
  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();
  const mudSet = new Set(mudPatches.map(p => `${p.x},${p.y}`));

  const startNode: AStarNode = { ...start, g: 0, h: heuristic(start, goal), f: heuristic(start, goal) };
  openSet.push(startNode);

  while (openSet.length > 0) {
    let lowestFIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestFIndex].f) {
        lowestFIndex = i;
      }
    }
    const currentNode = openSet.splice(lowestFIndex, 1)[0];
    closedSet.add(`${currentNode.x},${currentNode.y}`);

    if (currentNode.x === goal.x && currentNode.y === goal.y) {
      const path = reconstructPath(currentNode);
      return { path, cost: currentNode.g };
    }

    const neighbors = [
      { x: 0, y: -1 }, { x: 0, y: 1 },
      { x: -1, y: 0 }, { x: 1, y: 0 },
    ];

    for (const n of neighbors) {
      const neighborPos = { x: currentNode.x + n.x, y: currentNode.y + n.y };
      const neighborKey = `${neighborPos.x},${neighborPos.y}`;

      if (
        neighborPos.x < 0 || neighborPos.x >= GRID_SIZE ||
        neighborPos.y < 0 || neighborPos.y >= GRID_SIZE ||
        closedSet.has(neighborKey)
      ) {
        continue;
      }

      const moveCost = mudSet.has(neighborKey) ? MUD_COST : GRASS_COST;
      const gScore = currentNode.g + moveCost;

      let neighborNode = openSet.find(node => node.x === neighborPos.x && node.y === neighborPos.y);

      if (!neighborNode) {
        neighborNode = {
          ...neighborPos,
          g: gScore,
          h: heuristic(neighborPos, goal),
          f: gScore + heuristic(neighborPos, goal),
          parent: currentNode,
        };
        openSet.push(neighborNode);
      } else if (gScore < neighborNode.g) {
        neighborNode.g = gScore;
        neighborNode.f = gScore + neighborNode.h;
        neighborNode.parent = currentNode;
      }
    }
  }

  return { path: [], cost: Infinity };
};
