import React from 'react';
import { Monitor, Server, Shield, Database, Activity, Terminal } from 'lucide-react';

interface NodeDetailCardProps {
  node: any; // On reçoit l'objet complet du mockHost
}

export default function NodeDetailCard({ node }: NodeDetailCardProps) {
  if (!node) return null;

  // On détermine l'icône de titre selon le type
  const getHeaderIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'firewall': return <Shield size={20} className="text-red-500" />;
      case 'server': return <Database size={20} className="text-blue-500" />;
      case 'workstation': return <Monitor size={20} className="text-slate-500" />;
      default: return <Server size={20} className="text-blue-500" />;
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '300px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
      border: '1px solid #e2e8f0',
      zIndex: 1000,
      fontFamily: 'Inter, system-ui, sans-serif',
      pointerEvents: 'none', // Pour ne pas gêner les interactions avec la map
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
        {getHeaderIcon(node.type)}
        <div>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '15px', fontWeight: 700 }}>{node.hostname}</h3>
          <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{node.ip}</span>
        </div>
      </div>

      {/* Détails OS & Status */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
          <Activity size={14} /> <strong>OS:</strong> {node.os}
        </div>
      </div>

      {/* Services */}
      <div style={{ marginBottom: '15px' }}>
        <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Services actifs</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {node.services?.map((s: string) => (
            <span key={s} style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Ports */}
      {node.ports && node.ports.length > 0 && (
        <div>
          <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Ports ouverts</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            {node.ports.map((p: any) => (
              <div key={p.port} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>
                <Terminal size={10} /> {p.port}/{p.protocol}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}