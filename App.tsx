import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, Position, Resource, LogEntry, EventLogEntry, PathResult, StateRepresentation, Agent } from './types';
import { findPath } from './services/pathfinding';
import GameGrid from './components/GameGrid';
import StatsBar from './components/StatsBar';
import Controls from './components/Controls';
import Rules from './components/Rules';
import EventLog from './components/EventLog';
import StateLog from './components/StateLog';
import FocusModal from './components/FocusModal';
import EfficiencyDisplay from './components/EfficiencyDisplay';
import { playSound, initAudio } from './services/sound';
import { exportToCSV } from './services/csvExporter';
import { runExpertBotEpisode } from './services/bot';
import {
  GRID_SIZE,
  NUM_NORMAL_RESOURCES,
  NUM_GOLDEN_RESOURCES,
  NUM_MUD_PATCHES,
  GRASS_COST,
  MUD_COST,
  NORMAL_TREE_VALUE,
  GOLDEN_TREE_VALUE,
  BENCHMARK_COST_PER_POINT
} from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(0);
  const [benchmarkScore, setBenchmarkScore] = useState<number>(0);
  const [maxCost, setMaxCost] = useState<number>(200);
  const [stateLog, setStateLog] = useState<LogEntry[]>([]);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [episodeId, setEpisodeId] = useState<number>(1);
  const [currentLogId, setCurrentLogId] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [pathPreview, setPathPreview] = useState<PathResult>({ path: [], cost: 0 });
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; text: string }>({ visible: false, x: 0, y: 0, text: '' });
  const [efficiencyPreview, setEfficiencyPreview] = useState<number | 'infinity' | null>(null);
  const [isBotRunning, setIsBotRunning] = useState(false);

  const gameStateRef = useRef(gameState);
  const isGameActiveRef = useRef(isGameActive);
  const gameReadyResolver = useRef<(() => void) | null>(null);
  
  const createInitialGameState = useCallback((cost: number): GameState => {
    let base: Position;
    let agent: Agent;
    let mudPatches: Position[];
    let resources: Resource[];
    let isSolvable = false;

    // This loop will continue until a solvable map is generated.
    do {
        const occupied = new Set<string>();
        const getEmptyPosition = (): Position => {
            let pos: Position;
            do {
                pos = {
                    x: Math.floor(Math.random() * GRID_SIZE),
                    y: Math.floor(Math.random() * GRID_SIZE),
                };
            } while (occupied.has(`${pos.x},${pos.y}`));
            occupied.add(`${pos.x},${pos.y}`);
            return pos;
        };
        
        base = getEmptyPosition();
        occupied.add(`${base.x},${base.y}`);

        agent = { ...base, holding: null };

        mudPatches = Array.from({ length: NUM_MUD_PATCHES }, getEmptyPosition);
        
        const normalResources: Resource[] = Array.from({ length: NUM_NORMAL_RESOURCES }, () => ({
            ...getEmptyPosition(),
            type: 'normal',
            value: NORMAL_TREE_VALUE,
        }));
        
        const goldenResources: Resource[] = Array.from({ length: NUM_GOLDEN_RESOURCES }, () => ({
            ...getEmptyPosition(),
            type: 'golden',
            value: GOLDEN_TREE_VALUE,
        }));
        
        resources = [...normalResources, ...goldenResources];
        
        // --- Validation Step ---
        isSolvable = resources.some(resource => {
            const pathToResource = findPath(base, resource, mudPatches);
            if (pathToResource.cost === Infinity) return false;
            
            const pathToBase = findPath(resource, base, mudPatches);
            return pathToBase.cost !== Infinity;
        });

        if (!isSolvable) {
            console.warn("Generated an unsolvable map. Retrying...");
        }

    } while (!isSolvable);

    return {
      agent,
      base,
      mudPatches,
      resources,
      score: 0,
      stepCost: 0,
    };
  }, []);

  const calculateBenchmark = (cost: number) => Math.floor(cost / BENCHMARK_COST_PER_POINT);

  const addEvent = useCallback((entry: Omit<EventLogEntry, 'id'>) => {
    setEventLog(prev => [{ ...entry, id: Date.now() + Math.random() }, ...prev.slice(0, 99)]);
  }, []);
  
  const restartGame = useCallback(() => {
    return new Promise<void>((resolve) => {
      gameReadyResolver.current = resolve;
      setEpisodeId(prev => prev + 1);
      setGameState(createInitialGameState(maxCost));
      setEventLog([{ type: 'action-info', icon: '🚀', message: 'New game started!' }]);
      setIsGameActive(true);
      setBenchmarkScore(calculateBenchmark(maxCost));
      setHighScore(parseInt(localStorage.getItem(`highScore_${maxCost}`) || '0', 10));
    });
  }, [maxCost, createInitialGameState]);

  useEffect(() => {
    // This effect hook is the key to the synchronized restart.
    
    // CRITICAL FIX: Update refs *before* resolving the promise.
    // This guarantees that the refs are set with the new state *before*
    // the promise resolves, winning the race condition.
    gameStateRef.current = gameState;
    isGameActiveRef.current = isGameActive;

    // It resolves the promise created in `restartGame` only after the state updates have been applied.
    if (isGameActive && gameState && gameState.stepCost === 0 && gameReadyResolver.current) {
      gameReadyResolver.current();
      gameReadyResolver.current = null;
    }
  }, [isGameActive, gameState]);


  useEffect(() => {
      setGameState(createInitialGameState(maxCost));
      setBenchmarkScore(calculateBenchmark(maxCost));
      setHighScore(parseInt(localStorage.getItem(`highScore_${maxCost}`) || '0', 10));
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endGame = useCallback(() => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState) return;
    setIsGameActive(false);
    playSound('gameOver', 'C3', '1n');
    if (currentGameState.score > highScore) {
      setHighScore(currentGameState.score);
      localStorage.setItem(`highScore_${maxCost}`, currentGameState.score.toString());
      addEvent({ type: 'action-info', icon: '🏆', message: `New High Score: ${currentGameState.score}!` });
    }
    addEvent({ type: 'action-info', icon: '🏁', message: `Budget reached! <strong>Final Score: ${currentGameState.score}</strong>` });
    if (!isBotRunning) {
        setTimeout(restartGame, 4000);
    }
  }, [highScore, maxCost, addEvent, restartGame, isBotRunning]);

  useEffect(() => {
    // CRITICAL FIX: Also update refs here to keep them in sync on *every* state change.
    gameStateRef.current = gameState;
    isGameActiveRef.current = isGameActive;

    if (isGameActive && gameState && gameState.stepCost >= maxCost) {
      endGame();
    }
  }, [gameState, isGameActive, maxCost, endGame]);

  const logCurrentAction = useCallback((action: number, state: GameState) => {
    const currentStateRepresentation: StateRepresentation = {
        agent_pos: [state.agent.x, state.agent.y],
        holding: state.agent.holding ? state.agent.holding.type : 'none',
        base_pos: [state.base.x, state.base.y],
        normal_resources_pos: state.resources.filter(r => r.type === 'normal').map(r => [r.x, r.y]),
        golden_resources_pos: state.resources.filter(r => r.type === 'golden').map(r => [r.x, r.y]),
        mud_pos: state.mudPatches.map(m => [m.x, m.y]),
        remaining_cost: maxCost - state.stepCost
    };

    setStateLog(prev => [...prev, {
      id: currentLogId,
      episode_id: episodeId,
      state: currentStateRepresentation,
      action: action,
      score: state.score,
      cost: state.stepCost
    }]);
    setCurrentLogId(prev => prev + 1);
  }, [currentLogId, episodeId, maxCost]);

  const handleMove = useCallback((dx: number, dy: number) => {
    setGameState(prevState => {
      if (!prevState) return null;
      const { agent, mudPatches } = prevState;
      const newPos = { x: agent.x + dx, y: agent.y + dy };

      if (newPos.x < 0 || newPos.x >= GRID_SIZE || newPos.y < 0 || newPos.y >= GRID_SIZE) {
        return prevState;
      }
      
      const onMud = mudPatches.some(p => p.x === newPos.x && p.y === newPos.y);
      const cost = onMud ? MUD_COST : GRASS_COST;
      
      if (onMud) {
        playSound('moveMud', 'C2');
        addEvent({ type: 'cost-minus', icon: '🟫', message: `Moved onto mud. <strong>Cost: -${cost}</strong>` });
      } else {
        playSound('moveGrass', 'C4');
        addEvent({ type: 'cost-minus', icon: '🟩', message: `Moved onto grass. <strong>Cost: -${cost}</strong>` });
      }

      return {
        ...prevState,
        agent: { ...agent, x: newPos.x, y: newPos.y },
        stepCost: prevState.stepCost + cost,
      };
    });
  }, [addEvent]);

  const handleAction = useCallback(() => {
    setGameState(prevState => {
      if (!prevState) return null;
      const { agent, base, resources, score } = prevState;

      if (agent.holding && agent.x === base.x && agent.y === base.y) {
        const { value, type } = agent.holding;
        const newScore = score + value;
        if (score < benchmarkScore && newScore >= benchmarkScore) {
            addEvent({ type: 'target-reached', icon: '🎯', message: `Target score of ${benchmarkScore} reached!` });
            playSound('targetReached', 'E6', '8n');
        }
        addEvent({ type: 'score-plus', icon: '🏠', message: `Delivered ${type} tree! <strong>Score: +${value}</strong>` });
        playSound('deliver', 'G5', '8n');
        
        const occupied = new Set([
            `${base.x},${base.y}`,
            ...resources.map(r => `${r.x},${r.y}`),
            ...prevState.mudPatches.map(m => `${m.x},${m.y}`)
        ]);
        let newResPos: Position;
        do {
            newResPos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
        } while (occupied.has(`${newResPos.x},${newResPos.y}`));

        const newResource: Resource = { ...newResPos, type, value };
        
        return {
          ...prevState,
          agent: { ...agent, holding: null },
          score: newScore,
          resources: [...resources, newResource]
        };
      }
      
      if (!agent.holding) {
        const resourceIndex = resources.findIndex(r => r.x === agent.x && r.y === agent.y);
        if (resourceIndex !== -1) {
          const collectedResource = resources[resourceIndex];
          const type = collectedResource.type;
          const icon = type === 'golden' ? '🌟' : '🌳';
          addEvent({ type: 'action-info', icon, message: `Collected ${type} tree.` });
          playSound(type === 'golden' ? 'collectGolden' : 'collectNormal', type === 'golden' ? 'C6' : 'A5');
          
          return {
            ...prevState,
            agent: { ...agent, holding: collectedResource },
            resources: resources.filter((_, i) => i !== resourceIndex),
          };
        }
      }
      return prevState;
    });
  }, [addEvent, benchmarkScore]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isGameActive || !gameState || isBotRunning) return;
    
    let action = -1;
    switch (e.key) {
      case 'ArrowUp': action = 0; break;
      case 'ArrowDown': action = 1; break;
      case 'ArrowLeft': action = 2; break;
      case 'ArrowRight': action = 3; break;
      case ' ':
      case 'Enter':
        action = 4;
        break;
    }
    
    if (action !== -1) {
      e.preventDefault();
      logCurrentAction(action, gameState);
      switch(action) {
        case 0: handleMove(0, -1); break;
        case 1: handleMove(0, 1); break;
        case 2: handleMove(-1, 0); break;
        case 3: handleMove(1, 0); break;
        case 4: handleAction(); break;
      }
    }
  }, [isGameActive, gameState, logCurrentAction, handleMove, handleAction, isBotRunning]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const handleStartGame = async () => {
      await initAudio();
      restartGame();
  };

  const handleResourceHover = useCallback((resource: Resource | null) => {
    if (!resource || !gameState) {
      setPathPreview({ path: [], cost: 0 });
      setTooltip(prev => ({ ...prev, visible: false }));
      setEfficiencyPreview(null);
      return;
    }
    const pathResult = findPath(gameState.agent, resource, gameState.mudPatches);
    setPathPreview(pathResult);
    
    if(pathResult.path.length > 0) {
        setTooltip(prev => ({ ...prev, visible: true, text: `Cost: ${pathResult.cost}`}));
        const totalCost = pathResult.cost * 2;
        if (totalCost > 0) {
          const efficiency = resource.value / totalCost;
          setEfficiencyPreview(efficiency);
        } else {
          setEfficiencyPreview('infinity');
        }
    } else {
        setTooltip(prev => ({ ...prev, visible: false }));
        setEfficiencyPreview(null);
    }
  }, [gameState]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip(prev => ({ ...prev, x: e.clientX + 15, y: e.clientY }));
  }, []);

  const clearLogs = () => {
    setStateLog([]);
    setEventLog([]);
    setCurrentLogId(0);
    setEpisodeId(1);
    addEvent({ type: 'action-info', icon: '🧹', message: 'Logs cleared.' });
  };
  
  const downloadCSV = () => {
    if (stateLog.length === 0) {
      addEvent({ type: 'action-info', icon: '⚠️', message: 'No log data to download!' });
      return;
    }
    exportToCSV(stateLog);
  };
  
  const runBotGames = async () => {
    await initAudio();
    setIsBotRunning(true);

    for (let i = 0; i < 100; i++) {
        await restartGame();

        await runExpertBotEpisode({
            getGameState: () => gameStateRef.current,
            isGameActive: () => isGameActiveRef.current,
            maxCost,
            logCurrentAction,
            handleMove,
            handleAction,
            findPath,
        });
    }

    setIsBotRunning(false);
    addEvent({ type: 'action-info', icon: '🤖', message: 'Bot finished running 100 games.' });
  };

  const memoizedGameGrid = useMemo(() => (
    gameState ? <GameGrid 
      gameState={gameState}
      onResourceHover={handleResourceHover}
      onMouseMove={handleMouseMove}
      pathPreview={pathPreview}
      isGameActive={isGameActive}
    /> : null
  ), [gameState, handleResourceHover, handleMouseMove, pathPreview, isGameActive]);

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-bg-color text-text-color font-sans">
      <div className="w-full max-w-[1600px] flex flex-col gap-8">
        <header className="text-center">
          <h1 className="font-recursive text-4xl sm:text-5xl font-bold text-text-color m-0">Interactive Resource Gatherer</h1>
          <p className="text-lg sm:text-xl text-text-muted mt-2">Play the game to generate a dataset for the DRL agent.</p>
        </header>

        <main className="flex flex-col lg:flex-row justify-center items-start gap-8">
          <div className="flex-grow flex flex-col items-center gap-6 bg-primary-fill p-4 sm:p-8 rounded-2xl border-2 border-primary-border w-full lg:w-auto">
            {gameState && (
              <StatsBar 
                score={gameState.score}
                targetScore={benchmarkScore}
                highScore={highScore}
                costBudget={maxCost}
                stepCost={gameState.stepCost}
              />
            )}
            <div className="relative" onMouseMove={handleMouseMove}>
              {memoizedGameGrid}
              <FocusModal 
                isVisible={!isGameActive}
                onStart={handleStartGame}
                finalScore={gameState?.stepCost ?? 0 >= maxCost ? gameState?.score : undefined}
              />
               <div
                  className="fixed bg-gray-800 text-white py-1 px-3 rounded-md text-sm pointer-events-none transition-opacity z-20"
                  style={{ top: tooltip.y, left: tooltip.x, opacity: tooltip.visible ? 1 : 0 }}
                >
                  {tooltip.text}
                </div>
            </div>
            <Controls 
              costBudget={maxCost}
              onCostBudgetChange={(newCost) => {
                setMaxCost(newCost);
                setBenchmarkScore(calculateBenchmark(newCost));
                setHighScore(parseInt(localStorage.getItem(`highScore_${newCost}`) || '0', 10));
              }}
              onRestart={handleStartGame} // Changed to handleStartGame for consistency
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(!isMuted)}
              isBotRunning={isBotRunning}
              onRunBot={runBotGames}
            />
            <EfficiencyDisplay efficiency={efficiencyPreview} />
            <Rules />
          </div>
          
          <div className="w-full lg:max-w-sm xl:max-w-md flex flex-col gap-8">
             <EventLog entries={eventLog} />
             <StateLog
                logData={stateLog}
                onDownload={downloadCSV}
                onClear={clearLogs}
              />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;