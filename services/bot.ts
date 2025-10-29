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
  endGame: () => void; // Added endGame to dependencies
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Awaits a specific condition in the game state to become true.
 * This is crucial for synchronizing the bot's imperative logic with React's async state updates.
 * @param condition A function that returns true when the desired state is reached.
 * @param getGameState A function to get the current game state.
 * @param timeoutMs The maximum time to wait in milliseconds.
 * @returns The new game state if the condition is met, otherwise null.
 */
async function waitForStateChange(
  condition: (state: GameState) => boolean,
  getGameState: () => GameState | null,
  timeoutMs = 500, // Increased timeout for more reliability
  pollIntervalMs = 10
): Promise<GameState | null> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const currentState = getGameState();
    if (currentState && condition(currentState)) {
      return currentState;
    }
    await delay(pollIntervalMs);
  }
  console.error("Bot timed out waiting for state change.");
  return null; // Timed out
}


/**
 * Executes a path step-by-step, ensuring each move is confirmed in the state before proceeding.
 * @param path The array of positions to follow.
 * @param deps The bot's dependencies.
 * @returns A boolean indicating whether the path was completed successfully.
 */
async function executePath(path: Position[], deps: BotDependencies): Promise<boolean> {
  if (path.length < 2) {
    return true; // A path of 0 or 1 steps is instantly successful.
  }

  for (let i = 0; i < path.length - 1; i++) {
    if (!deps.isGameActive()) return false;

    const currentStep = path[i];
    const nextStep = path[i + 1];

    const stateBeforeMove = deps.getGameState();
    if (!stateBeforeMove) return false;

    // Sanity check: Ensure agent is where we expect it to be before moving.
    if (stateBeforeMove.agent.x !== currentStep.x || stateBeforeMove.agent.y !== currentStep.y) {
      console.error("Bot Desync! Agent is not at the expected path position. Aborting path.", {
        expected: currentStep,
        actual: stateBeforeMove.agent,
      });
      return false;
    }

    const dx = nextStep.x - currentStep.x;
    const dy = nextStep.y - currentStep.y;

    let action = -1;
    if (dx === 0 && dy === -1) action = 0; // Up
    if (dx === 0 && dy === 1) action = 1;  // Down
    if (dx === -1 && dy === 0) action = 2; // Left
    if (dx === 1 && dy === 0) action = 3;  // Right

    if (action !== -1) {
      deps.logCurrentAction(action, stateBeforeMove);
      deps.handleMove(dx, dy);
      
      // CRITICAL FIX: Wait for the state to reflect that the move was completed.
      const stateAfterMove = await waitForStateChange(
        (state) => state.agent.x === nextStep.x && state.agent.y === nextStep.y,
        deps.getGameState
      );

      if (!stateAfterMove) {
        console.error("Bot failed to confirm move completion. Aborting path.");
        return false;
      }
    }
  }
  return true;
}

export async function runExpertBotEpisode(deps: BotDependencies) {
  while (deps.isGameActive()) {
    const initialGameState = deps.getGameState();
    if (!initialGameState) break;

    let bestResource: Resource | null = null;
    let bestPathToResource: PathResult | null = null;
    let bestPathToBase: PathResult | null = null;
    let maxEfficiency = -1;
    let bestResourcePathToResourceCost = Infinity;

    for (const resource of initialGameState.resources) {
      const pathToResource = deps.findPath(initialGameState.agent, resource, initialGameState.mudPatches);
      const pathToBase = deps.findPath(resource, initialGameState.base, initialGameState.mudPatches);

      if (pathToResource.cost === Infinity || pathToBase.cost === Infinity) {
        continue; 
      }
      
      const totalCost = pathToResource.cost + pathToBase.cost;

      // FIX: Handle "infinite efficiency" case (zero cost) as the highest priority
      if (totalCost === 0 && resource.value > 0) {
        maxEfficiency = Infinity;
        bestResource = resource;
        bestPathToResource = pathToResource;
        bestPathToBase = pathToBase;
        break; // Nothing can be more efficient, so we can stop searching.
      }
      
      if (initialGameState.stepCost + totalCost > deps.maxCost) {
        continue;
      }
      
      const efficiency = resource.value / totalCost;

      if (efficiency > maxEfficiency) {
        maxEfficiency = efficiency;
        bestResource = resource;
        bestPathToResource = pathToResource;
        bestPathToBase = pathToBase;
        bestResourcePathToResourceCost = pathToResource.cost;
      } else if (efficiency === maxEfficiency) {
        // FIX: Tie-break by choosing the resource that is CLOSER TO THE AGENT
        if (pathToResource.cost < bestResourcePathToResourceCost) {
          bestResource = resource;
          bestPathToResource = pathToResource;
          bestPathToBase = pathToBase;
          bestResourcePathToResourceCost = pathToResource.cost;
        }
      }
    }

    if (!bestResource || !bestPathToResource || !bestPathToBase) {
      // If no profitable resource is found, the bot considers the game over.
      // It must call endGame() to signal this to the main app.
      deps.endGame();
      break; 
    }

    // --- Execute Plan ---

    // 1. Go to the most efficient resource
    const pathSuccess = await executePath(bestPathToResource.path, deps);
    if (!pathSuccess || !deps.isGameActive()) break;

    // 2. Collect the resource and wait for the state to update
    const stateBeforeCollect = deps.getGameState();
    if (stateBeforeCollect) {
        deps.logCurrentAction(4, stateBeforeCollect);
        deps.handleAction();
    }
    
    const stateAfterCollect = await waitForStateChange(
        (state) => !!state.agent.holding,
        deps.getGameState
    );

    if (!stateAfterCollect) {
        console.error("Bot: Collection seems to have failed or timed out.");
        break; 
    }
    
    // 3. Go back to base
    const returnPathSuccess = await executePath(bestPathToBase.path, deps);
    if (!returnPathSuccess || !deps.isGameActive()) break;

    // 4. Deliver the resource and wait for the state to update
    const stateBeforeDeliver = deps.getGameState();
    if (stateBeforeDeliver && stateBeforeDeliver.agent.x === stateBeforeDeliver.base.x && stateBeforeDeliver.agent.y === stateBeforeDeliver.base.y) {
        deps.logCurrentAction(4, stateBeforeDeliver);
        deps.handleAction();

        const stateAfterDeliver = await waitForStateChange(
            (state) => !state.agent.holding,
            deps.getGameState
        );

        if (!stateAfterDeliver) {
            console.error("Bot: Delivery seems to have failed or timed out.");
            break;
        }
    }
  }
}
