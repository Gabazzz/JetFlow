import React from 'react';
import { User, Calendar, ExternalLink } from 'lucide-react';

export default function ClientsListView({ clients, onNavigate }) {
  return (
    <div className="client-list-container">
      <div className="client-table-card">
        <table className="client-table" aria-label="Lista de Clientes">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Etapa Onboarding</th>
              <th>Responsável</th>
              <th>Contato</th>
              <th>Plano</th>
              <th>Data Entrada</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="client-row-name" onClick={() => onNavigate(`clientes/${client.id}`)}>
                  {client.name}
                </td>
                <td>
                  <span className="badge done" style={{ fontSize: '10px' }}>
                    {client.stage}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={12} className="nav-icon" style={{ margin: 0, opacity: 0.8 }} />
                    <span>{client.owner}</span>
                  </div>
                </td>
                <td>{client.email}</td>
                <td>
                  <span style={{ color: 'var(--color-info)', fontWeight: '500' }}>
                    {client.plan}
                  </span>
                </td>
                <td>{client.entryDate}</td>
                <td>
                  <button 
                    className="btn-action-outline" 
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                    onClick={() => onNavigate(`clientes/${client.id}`)}
                  >
                    Ver 360
                    <ExternalLink size={10} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
