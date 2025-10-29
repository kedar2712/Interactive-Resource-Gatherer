
import { LogEntry } from '../types';
import { NUM_NORMAL_RESOURCES, NUM_GOLDEN_RESOURCES, NUM_MUD_PATCHES } from '../constants';

export const exportToCSV = (logData: LogEntry[]): void => {
  if (logData.length === 0) {
    console.warn("No log data to export.");
    return;
  }

  const headers = [
    'episode_id', 'log_id', 'agent_x', 'agent_y', 'holding', 'base_x', 'base_y',
    ...Array.from({ length: NUM_NORMAL_RESOURCES }, (_, i) => `norm_res_${i}_x`),
    ...Array.from({ length: NUM_NORMAL_RESOURCES }, (_, i) => `norm_res_${i}_y`),
    ...Array.from({ length: NUM_GOLDEN_RESOURCES }, (_, i) => `gold_res_${i}_x`),
    ...Array.from({ length: NUM_GOLDEN_RESOURCES }, (_, i) => `gold_res_${i}_y`),
    ...Array.from({ length: NUM_MUD_PATCHES }, (_, i) => `mud_${i}_x`),
    ...Array.from({ length: NUM_MUD_PATCHES }, (_, i) => `mud_${i}_y`),
    'remaining_cost', 'action', 'score', 'cost'
  ];

  const rows = logData.map(log => {
    const { state } = log;
    const holdingMap = { 'none': 0, 'normal': 1, 'golden': 2 };

    const pad = (arr: [number, number][], len: number): [number, number][] => {
      const padded = [...arr];
      while (padded.length < len) {
        padded.push([-1, -1]);
      }
      return padded;
    };

    const norm_res = pad(state.normal_resources_pos, NUM_NORMAL_RESOURCES);
    const gold_res = pad(state.golden_resources_pos, NUM_GOLDEN_RESOURCES);
    const mud = pad(state.mud_pos, NUM_MUD_PATCHES);

    const rowData = [
      log.episode_id, log.id,
      state.agent_pos[0], state.agent_pos[1],
      holdingMap[state.holding],
      state.base_pos[0], state.base_pos[1],
      ...norm_res.flatMap(p => p),
      ...gold_res.flatMap(p => p),
      ...mud.flatMap(p => p),
      state.remaining_cost,
      log.action, log.score, log.cost
    ];
    return rowData.join(',');
  });

  const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + '\n' + rows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "game_logs.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
