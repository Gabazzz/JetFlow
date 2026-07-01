import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { parseBRDate, formatBRDate } from '../utils';

export default function CustomDatePicker({ value, onChange, placeholder = 'DD/MM/AAAA', required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  // Set reference system date to 30/06/2026
  const today = new Date(2026, 5, 30); // 0-indexed month: 5 = June

  // viewDate controls which month the calendar dropdown is showing
  const [viewDate, setViewDate] = useState(today);

  // Initialize viewDate to value if valid, else today
  useEffect(() => {
    if (value && value.includes('/')) {
      try {
        const parsed = parseBRDate(value);
        if (!isNaN(parsed.getTime())) {
          setViewDate(parsed);
        }
      } catch (e) {}
    }
  }, [value, isOpen]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day, isCurrentMonth, e) => {
    e.stopPropagation();
    let targetMonth = viewDate.getMonth();
    let targetYear = viewDate.getFullYear();

    if (!isCurrentMonth) {
      // If it's a day of the previous or next month
      if (day > 15) {
        // Previous month
        targetMonth -= 1;
      } else {
        // Next month
        targetMonth += 1;
      }
    }

    const selectedDate = new Date(targetYear, targetMonth, day);
    onChange(formatBRDate(selectedDate));
    setIsOpen(false);
  };

  // Generate calendar grid (42 days total)
  const getCalendarCells = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // First day of current month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Number of days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Number of days in previous month
    const prevTotalDays = new Date(year, month, 0).getDate();

    const cells = [];

    // Pad previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: prevTotalDays - i,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        day: i,
        isCurrentMonth: true
      });
    }

    // Pad next month days
    const remainingCells = 42 - cells.length;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push({
        day: i,
        isCurrentMonth: false
      });
    }

    return cells;
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  // Check if a day cell matches the selected date
  const isSelected = (day, isCurrentMonth) => {
    if (!value || !isCurrentMonth) return false;
    try {
      const selected = parseBRDate(value);
      return (
        selected.getDate() === day &&
        selected.getMonth() === viewDate.getMonth() &&
        selected.getFullYear() === viewDate.getFullYear()
      );
    } catch (e) {
      return false;
    }
  };

  // Check if a day cell matches today (30/06/2026)
  const isToday = (day, isCurrentMonth) => {
    if (!isCurrentMonth) return false;
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="custom-datepicker" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Date display input trigger */}
      <div 
        style={{ display: 'flex', alignItems: 'center', position: 'relative', cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <input 
          type="text" 
          className="form-input" 
          value={value} 
          placeholder={placeholder} 
          readOnly 
          required={required}
          style={{ width: '100%', paddingRight: '36px', cursor: 'pointer' }}
        />
        <CalendarIcon size={16} style={{ position: 'absolute', right: '12px', color: 'var(--text-secondary)' }} />
      </div>

      {/* Dropdown calendar menu */}
      {isOpen && (
        <div className="datepicker-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="datepicker-header">
            <button type="button" className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={handlePrevMonth}>
              <ChevronLeft size={14} />
            </button>
            <span className="datepicker-month-title">
              {monthNames[viewDate.getMonth()]} de {viewDate.getFullYear()}
            </span>
            <button type="button" className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={handleNextMonth}>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="datepicker-weekdays">
            {weekDays.map((d, index) => (
              <span key={index} className="datepicker-weekday">{d}</span>
            ))}
          </div>

          <div className="datepicker-grid">
            {getCalendarCells().map((cell, index) => {
              const selected = isSelected(cell.day, cell.isCurrentMonth);
              const todayDay = isToday(cell.day, cell.isCurrentMonth);
              
              let cellClass = 'datepicker-day';
              if (!cell.isCurrentMonth) cellClass += ' datepicker-other-month';
              if (selected) cellClass += ' datepicker-selected';
              if (todayDay) cellClass += ' datepicker-today';

              return (
                <button
                  key={index}
                  type="button"
                  className={cellClass}
                  onClick={(e) => handleSelectDay(cell.day, cell.isCurrentMonth, e)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
