import { GameState, Position, Resource, PathResult } from '../types';
import { findPath } from './pathfinding';

interface BotDependencies {
  getGameState: () => GameState | null;
  isGameActive: () => boolean;
  maxCost: number;
  logCurrentAction: (action: number, state: GameState) => void;
  handleMove: (dx: number, dy: number) => void;
  handleAction: () => void;
  findPath: typeof findPath;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function executePath(path: Position[], deps: BotDependencies) {
  const currentState = deps.getGameState();
  if (!currentState) return;

  let currentPos: Position = currentState.agent;

  for (const nextPos of path.slice(1)) {
    if (!deps.isGameActive()) return;

    const dx = nextPos.x - currentPos.x;
    const dy = nextPos.y - currentPos.y;

    let action = -1;
    if (dx === 0 && dy === -1) action = 0; // Up
    if (dx === 0 && dy === 1) action = 1;  // Down
    if (dx === -1 && dy === 0) action = 2; // Left
    if (dx === 1 && dy === 0) action = 3;  // Right

    if (action !== -1) {
      const stateBeforeMove = deps.getGameState();
      if (stateBeforeMove) {
        deps.logCurrentAction(action, stateBeforeMove);
        deps.handleMove(dx, dy);
        // OPTIMIZATION: Use a 0ms delay to yield to the event loop, allowing React state to update
        // without introducing significant latency. This makes the bot run much faster.
        await delay(0);
      }
    }
    currentPos = nextPos;
  }
}

export async function runExpertBotEpisode(deps: BotDependencies) {
  while (deps.isGameActive()) {
    const gameState = deps.getGameState();
    if (!gameState) break;

    // FIX 1: Removed the faulty state check. The bot should be able to start a new
    // cycle from the base after delivering a resource. This check incorrectly
    // terminated the episode after only one resource was collected.

    let bestResource: Resource | null = null;
    let maxEfficiency = -1;

    for (const resource of gameState.resources) {
      const pathToResource = deps.findPath(gameState.agent, resource, gameState.mudPatches);
      
      // FIX 2: Corrected the budgeting logic. An expert bot should collect a resource
      // if it can REACH it, even if it can't afford the full return trip. This maximizes
      // score potential near the end of the budget.
      if (gameState.stepCost + pathToResource.cost > deps.maxCost) {
        continue; // Cannot afford to even reach this resource
      }

      const pathToBase = deps.findPath(resource, gameState.base, gameState.mudPatches);

      if (pathToResource.cost === Infinity || pathToBase.cost === Infinity) {
        continue; // Unreachable
      }

      const totalCost = pathToResource.cost + pathToBase.cost;
      if (totalCost === 0) continue;

      const efficiency = resource.value / totalCost;

      if (efficiency > maxEfficiency) {
        maxEfficiency = efficiency;
        bestResource = resource;
      }
    }

    if (!bestResource) {
      // No affordable/reachable resource found, the bot's run is effectively over.
      break; 
    }

    // --- Execute Plan ---

    // 1. Go to the most efficient resource
    const pathToResource = deps.findPath(gameState.agent, bestResource, gameState.mudPatches);
    await executePath(pathToResource.path, deps);
    if (!deps.isGameActive()) break;

    // 2. Collect the resource
    let stateBeforeAction = deps.getGameState();
    if (stateBeforeAction) {
      deps.logCurrentAction(4, stateBeforeAction);
      deps.handleAction();
      await delay(0);
    }
    if (!deps.isGameActive()) break;
    
    // 3. Go back to base
    const currentState = deps.getGameState();
    if (!currentState) break;
    const pathToBase = deps.findPath(currentState.agent, currentState.base, currentState.mudPatches);
    await executePath(pathToBase.path, deps);
    if (!deps.isGameActive()) break;

    // 4. Deliver the resource
    stateBeforeAction = deps.getGameState();
    if (stateBeforeAction && stateBeforeAction.agent.x === stateBeforeAction.base.x && stateBeforeAction.agent.y === stateBeforeAction.base.y) {
        deps.logCurrentAction(4, stateBeforeAction);
        deps.handleAction();
        await delay(0);
    }
  }
}
