// Waveform rendering utilities
import type { TimeSeriesData, EventData } from '../../shared/types/ipc';

export function renderWaveform(
  ctx: CanvasRenderingContext2D,
  data: TimeSeriesData,
  viewportStart: number,
  viewportEnd: number,
  height: number
) {
  // TODO: Implement waveform rendering
  // 1. Find visible data range (binary search)
  // 2. Normalize values
  // 3. Draw line path
}

export function renderEvents(
  ctx: CanvasRenderingContext2D,
  data: EventData,
  viewportStart: number,
  viewportEnd: number,
  height: number
) {
  // TODO: Implement event rendering
  // 1. Filter visible events
  // 2. Draw markers (circles)
  // 3. Draw labels
}
