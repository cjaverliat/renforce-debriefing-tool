// Time ruler component
import React from 'react';

interface TimeRulerProps {
  start: number;  // milliseconds
  end: number;    // milliseconds
}

export function TimeRuler({ start, end }: TimeRulerProps) {
  // TODO: Implement time ruler with tick marks and labels
  return (
    <div style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>
      Time Ruler: {start}ms - {end}ms
    </div>
  );
}