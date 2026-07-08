import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function PremiumSelect({
  value,
  onChange,
  options, // Array of { value, label, colorBar }
  placeholder = 'Selecione...',
  searchable = false,
  required = false,
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = searchable
    ? options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div 
      className="premium-select-container" 
      ref={containerRef}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      {/* Trigger Button */}
      <div 
        className={`premium-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: '#0D0D0D',
          border: isOpen ? '1px solid #65FF4B' : '1px solid #2E2E2E',
          borderRadius: '8px',
          color: selectedOption ? '#FFF' : '#555',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(101,255,75,0.1)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {selectedOption?.colorBar && (
            <span 
              style={{
                width: '4px',
                height: '14px',
                borderRadius: '2px',
                backgroundColor: selectedOption.colorBar,
                display: 'inline-block',
                flexShrink: 0
              }}
            />
          )}
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          style={{ 
            color: '#888', 
            transition: 'transform 200ms ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: '8px',
            flexShrink: 0
          }} 
        />
      </div>

      {/* Hidden input to support form validations */}
      <input 
        type="text" 
        value={value || ''} 
        onChange={() => {}} 
        required={required} 
        style={{ 
          position: 'absolute', 
          width: '100%', 
          height: '0', 
          opacity: 0, 
          pointerEvents: 'none' 
        }} 
      />

      {/* Dropdown Options */}
      {isOpen && (
        <div 
          className="premium-select-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: '#161616',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 1050,
            maxHeight: '260px',
            overflowY: 'auto',
            transformOrigin: 'top',
            animation: 'premiumDropdownOpen 200ms cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Search Input inside dropdown */}
          {searchable && (
            <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
                autoFocus
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: '13px',
                  backgroundColor: '#0A0A0A',
                  border: '1px solid #2A2A2A',
                  borderRadius: '6px',
                  color: '#FFF'
                }}
              />
            </div>
          )}

          {/* Options List */}
          <div style={{ padding: '4px 0' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 16px', color: '#555', fontSize: '13px', textAlign: 'center' }}>
                Nenhum resultado
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isItemSel = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className="premium-select-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      fontSize: '14px',
                      color: isItemSel ? 'var(--green-primary)' : '#FFF',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      {opt.colorBar && (
                        <span 
                          style={{
                            width: '4px',
                            height: '14px',
                            borderRadius: '2px',
                            backgroundColor: opt.colorBar,
                            display: 'inline-block',
                            flexShrink: 0
                          }}
                        />
                      )}
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {opt.label}
                      </span>
                    </div>
                    {isItemSel && (
                      <Check size={14} style={{ color: 'var(--green-primary)', marginLeft: '8px', flexShrink: 0 }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
