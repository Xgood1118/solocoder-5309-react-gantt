import React from 'react';
import { DEPENDENCY_TYPES } from '../utils/criticalPath';

const DEP_COLORS = {
  [DEPENDENCY_TYPES.FS]: '#6366f1',
  [DEPENDENCY_TYPES.SS]: '#f59e0b',
  [DEPENDENCY_TYPES.FF]: '#10b981',
  [DEPENDENCY_TYPES.SF]: '#ec4899',
};

export default function DependencyLines({
  dependencies,
  taskPositions,
  taskRows,
  rowHeight,
  taskHeight,
  headerHeight,
  totalHeight,
}) {
  if (!dependencies || dependencies.length === 0) return null;

  const lines = [];

  dependencies.forEach((dep, index) => {
    const fromPos = taskPositions[dep.fromTaskId];
    const toPos = taskPositions[dep.toTaskId];
    const fromRow = taskRows[dep.fromTaskId];
    const toRow = taskRows[dep.toTaskId];

    if (!fromPos || !toPos || fromRow === undefined || toRow === undefined) return;

    const fromTop = headerHeight + fromRow * rowHeight + taskHeight / 2 + 6;
    const toTop = headerHeight + toRow * rowHeight + taskHeight / 2 + 6;

    let fromX, toX;
    const type = dep.type || DEPENDENCY_TYPES.FS;
    const color = DEP_COLORS[type] || '#6366f1';

    if (type === DEPENDENCY_TYPES.FS) {
      fromX = fromPos.left + fromPos.width;
      toX = toPos.left;
    } else if (type === DEPENDENCY_TYPES.SS) {
      fromX = fromPos.left;
      toX = toPos.left;
    } else if (type === DEPENDENCY_TYPES.FF) {
      fromX = fromPos.left + fromPos.width;
      toX = toPos.left + toPos.width;
    } else if (type === DEPENDENCY_TYPES.SF) {
      fromX = fromPos.left;
      toX = toPos.left + toPos.width;
    }

    const isSameRow = fromRow === toRow;
    const arrowSize = 8;

    let pathD;

    if (isSameRow) {
      const midY = fromTop;
      const dx = Math.abs(toX - fromX);

      if (fromX < toX) {
        const controlOffset = Math.min(dx * 0.5, 30);
        pathD = `M ${fromX} ${midY} 
                 C ${fromX + controlOffset} ${midY}, 
                   ${toX - controlOffset} ${midY}, 
                   ${toX - arrowSize} ${midY}`;
      } else {
        const arcHeight = 20;
        pathD = `M ${fromX} ${midY} 
                 Q ${fromX + 15} ${midY - arcHeight}, 
                   ${(fromX + toX) / 2} ${midY - arcHeight}
                 Q ${toX - 15} ${midY - arcHeight},
                   ${toX + arrowSize} ${midY}`;
      }
    } else {
      const offset = 20;
      const turnOffset = 8;

      if (type === DEPENDENCY_TYPES.FS) {
        pathD = `M ${fromX} ${fromTop} 
                 h ${offset}
                 V ${toTop}
                 h ${-offset + turnOffset}`;
      } else if (type === DEPENDENCY_TYPES.SS) {
        pathD = `M ${fromX} ${fromTop} 
                 h ${-offset}
                 V ${toTop}
                 h ${offset - turnOffset}`;
      } else if (type === DEPENDENCY_TYPES.FF) {
        pathD = `M ${fromX} ${fromTop} 
                 h ${offset}
                 V ${toTop}
                 h ${-offset - turnOffset}`;
      } else {
        pathD = `M ${fromX} ${fromTop} 
                 h ${-offset}
                 V ${toTop}
                 h ${offset + turnOffset}`;
      }
    }

    const arrowRotation = type === DEPENDENCY_TYPES.FS || type === DEPENDENCY_TYPES.SS ? 0 : 180;

    lines.push(
      <g key={dep.id || index}>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          style={{ pointerEvents: 'none' }}
        />
        <polygon
          points={`0,-5 10,0 0,5`}
          fill={color}
          transform={`translate(${toX}, ${toTop}) rotate(${arrowRotation})`}
          style={{ pointerEvents: 'none' }}
        />
        <title>{type} 依赖</title>
      </g>
    );
  });

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: totalHeight || '100%',
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'visible',
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
        </marker>
      </defs>
      {lines}
    </svg>
  );
}
