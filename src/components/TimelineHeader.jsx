import React from 'react';
import { format, isToday, isSameDay, startOfMonth, getMonth, getYear } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { VIEW_MODES, getCellWidth, getTodayPosition } from '../utils/dateUtils';

export default function TimelineHeader({
  viewMode,
  timeCells,
  viewStart,
  headerHeight,
  leftPanelWidth,
}) {
  const cellWidth = getCellWidth(viewMode);
  const todayLeft = getTodayPosition(viewStart, viewMode);

  const renderSubHeaders = () => {
    if (viewMode === VIEW_MODES.DAY) {
      const months = [];
      let currentMonth = null;
      let startIndex = 0;

      timeCells.forEach((cell, index) => {
        const month = getMonth(cell.date);
        const year = getYear(cell.date);
        const key = `${year}-${month}`;

        if (currentMonth !== key) {
          if (currentMonth !== null) {
            months.push({
              label: format(timeCells[startIndex].date, 'yyyy年MM月', { locale: zhCN }),
              left: startIndex * cellWidth,
              width: (index - startIndex) * cellWidth,
            });
          }
          currentMonth = key;
          startIndex = index;
        }
      });

      if (currentMonth !== null && startIndex < timeCells.length) {
        months.push({
          label: format(timeCells[startIndex].date, 'yyyy年MM月', { locale: zhCN }),
          left: startIndex * cellWidth,
          width: (timeCells.length - startIndex) * cellWidth,
        });
      }

      return months.map((m, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: m.left,
            top: 0,
            width: m.width,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            fontWeight: 600,
            fontSize: 13,
            color: '#374151',
          }}
        >
          {m.label}
        </div>
      ));
    }

    if (viewMode === VIEW_MODES.WEEK) {
      const months = [];
      let currentMonth = null;
      let startIndex = 0;

      timeCells.forEach((cell, index) => {
        const month = getMonth(startOfMonth(cell.date));
        const year = getYear(cell.date);
        const key = `${year}-${month}`;

        if (currentMonth !== key) {
          if (currentMonth !== null) {
            months.push({
              label: format(timeCells[startIndex].date, 'yyyy年MM月', { locale: zhCN }),
              left: startIndex * cellWidth,
              width: (index - startIndex) * cellWidth,
            });
          }
          currentMonth = key;
          startIndex = index;
        }
      });

      if (currentMonth !== null && startIndex < timeCells.length) {
        months.push({
          label: format(timeCells[startIndex].date, 'yyyy年MM月', { locale: zhCN }),
          left: startIndex * cellWidth,
          width: (timeCells.length - startIndex) * cellWidth,
        });
      }

      return months.map((m, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: m.left,
            top: 0,
            width: m.width,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            fontWeight: 600,
            fontSize: 13,
            color: '#374151',
          }}
        >
          {m.label}
        </div>
      ));
    }

    return null;
  };

  const subHeaders = renderSubHeaders();
  const bottomTop = subHeaders ? 30 : 0;
  const bottomHeight = subHeaders ? 30 : 60;

  return (
    <div
      className="gantt-timeline-header"
      style={{
        position: 'relative',
        height: headerHeight,
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        overflow: 'hidden',
        marginLeft: leftPanelWidth,
      }}
    >
      {subHeaders}

      <div
        style={{
          position: 'absolute',
          top: bottomTop,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {timeCells.map((cell, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: index * cellWidth,
              top: 0,
              width: cellWidth,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '1px solid #e5e7eb',
              fontSize: viewMode === VIEW_MODES.DAY ? 12 : 13,
              color: isToday(cell.date) ? '#dc2626' : '#4b5563',
              fontWeight: isToday(cell.date) ? 600 : 400,
              backgroundColor: isToday(cell.date) ? '#fef2f2' : 'transparent',
            }}
          >
            {cell.label}
            {viewMode === VIEW_MODES.DAY && (
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                {format(cell.date, 'EEE', { locale: zhCN })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: todayLeft,
          width: 2,
          height: headerHeight,
          backgroundColor: '#dc2626',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: todayLeft - 20,
          backgroundColor: '#dc2626',
          color: 'white',
          fontSize: 11,
          padding: '2px 6px',
          borderRadius: 3,
          zIndex: 20,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        今天
      </div>
    </div>
  );
}
