import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Drop-in replacement for a native <select> — the browser's own dropdown
// list can't be restyled, so this renders a fully custom, theme-matched one.
export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecionar...',
  style,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedOptions = options.map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
  const selected = normalizedOptions.find(o => o.value === value);

  return (
    <div className="custom-select" style={style} ref={wrapperRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(v => !v)}
        disabled={disabled}
      >
        <span className={selected ? '' : 'custom-select-placeholder'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease-out', flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown">
          {normalizedOptions.map(opt => (
            <button
              type="button"
              key={opt.value}
              className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
