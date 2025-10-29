
export interface Position {
  x: number;
  y: number;
}

export interface Resource extends Position {
  type: 'normal' | 'golden';
  value: number;
}

export interface Agent extends Position {
  holding: Resource | null;
}

export interface GameState {
  agent: Agent;
  resources: Resource[];
  mudPatches: Position[];
  base: Position;
  score: number;
  stepCost: number;
}

export interface StateRepresentation {
    agent_pos: [number, number];
    holding: 'none' | 'normal' | 'golden';
    base_pos: [number, number];
    normal_resources_pos: [number, number][];
    golden_resources_pos: [number, number][];
    mud_pos: [number, number][];
    remaining_cost: number;
}

export interface LogEntry {
  id: number;
  episode_id: number;
  state: StateRepresentation;
  action: number;
  score: number;
  cost: number;
}

export interface EventLogEntry {
  id?: number;
  type: 'score-plus' | 'cost-minus' | 'action-info' | 'target-reached';
  icon: string;
  message: string;
}

export interface AStarNode extends Position {
  g: number;
  h: number;
  f: number;
  parent?: AStarNode;
}

export interface PathResult {
  path: Position[];
  cost: number;
}
