import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';
import useFloatingPosition from '../hooks/useFloatingPosition';

// Drop-in replacement for a native <select> — the browser's own dropdown
// list can't be restyled, so this renders a fully custom, theme-matched one.
// Lists longer than SEARCH_THRESHOLD get a live filter box automatically.
const SEARCH_THRESHOLD = 7;

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecionar...',
  style,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const floatPos = useFloatingPosition(triggerRef, isOpen);

  const normalizedOptions = useMemo(
    () => options.map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt)),
    [options]
  );
  const selected = normalizedOptions.find(o => o.value === value);
  const searchable = normalizedOptions.length > SEARCH_THRESHOLD;

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return normalizedOptions;
    const q = search.trim().toLowerCase();
    return normalizedOptions.filter(o => o.label.toLowerCase().includes(q));
  }, [normalizedOptions, search, searchable]);

  useEffect(() => {
    function handleClickOutside(e) {
      const insideWrapper = wrapperRef.current && wrapperRef.current.contains(e.target);
      const insideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!insideWrapper && !insideDropdown) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      // Usa normalizedOptions (não filteredOptions) porque a busca só é
      // zerada NESTE efeito — no render em que isOpen vira true, uma busca
      // digitada numa sessão anterior ainda estaria filtrando a lista, e o
      // índice calculado contra ela ficaria errado.
      setHighlightIndex(Math.max(0, normalizedOptions.findIndex(o => o.value === value)));
      if (searchable) setTimeout(() => searchRef.current?.focus(), 10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const commitSelection = (opt) => {
    onChange(opt.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(i => Math.min(i + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightIndex]) commitSelection(filteredOptions[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="custom-select" style={style} ref={wrapperRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        ref={triggerRef}
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(v => !v)}
        disabled={disabled}
      >
        <span className={selected ? '' : 'custom-select-placeholder'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease-out', flexShrink: 0 }} />
      </button>

      {isOpen && floatPos && createPortal(
        <div
          ref={dropdownRef}
          className="custom-select-dropdown"
          style={{
            position: 'fixed',
            left: floatPos.left,
            width: floatPos.width,
            top: floatPos.top ?? undefined,
            bottom: floatPos.bottom ?? undefined,
            transformOrigin: floatPos.openUp ? 'bottom center' : 'top center'
          }}
        >
          {searchable && (
            <div className="custom-select-search">
              <Search size={13} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setHighlightIndex(0); }}
                placeholder="Buscar..."
              />
            </div>
          )}
          <div className="custom-select-options">
            {filteredOptions.length === 0 ? (
              <div className="custom-select-empty">Nada encontrado.</div>
            ) : (
              filteredOptions.map((opt, idx) => (
                <button
                  type="button"
                  key={opt.value}
                  className={`custom-select-option ${opt.value === value ? 'selected' : ''} ${idx === highlightIndex ? 'highlighted' : ''}`}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onClick={() => commitSelection(opt)}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && <Check size={13} />}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
