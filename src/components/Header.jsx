import React from 'react';
import { Search } from 'lucide-react';

export default function Header({ title }) {
  return (
    <header className="global-header">
      <h1 className="page-title">{title}</h1>
      <div className="search-bar-container">
        <Search className="search-icon" />
        <input 
          type="text" 
          className="search-input" 
          placeholder="Buscar cliente, empresa, CNPJ..." 
          disabled
          style={{ cursor: 'not-allowed' }}
          title="Busca global desabilitada nesta fase"
        />
      </div>
    </header>
  );
}
