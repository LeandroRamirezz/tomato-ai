import { useState, useEffect } from 'react';
import axios from 'axios';

// Detectamos si estamos en "localhost" o en la web real
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Si es local usa el 5000, si es web usa Render (URL fija)
const API_URL = isLocal 
  ? 'http://localhost:5000/api' 
  : 'https://tomato-backend-2giv.onrender.com/api';

console.log("🌍 Entorno detectado:", isLocal ? "Local" : "Producción");
console.log("🔗 Conectando a:", API_URL);

export function HistoryView() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Historial
      const historyRes = await axios.get(`${API_URL}/predictions?limit=20`);
      setHistory(historyRes.data.predictions);

      // 2. Cargar Estadísticas
      const statsRes = await axios.get(`${API_URL}/stats`);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el historial. ¿La base de datos está conectada?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Función auxiliar para formatear fechas
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-ES', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  // Función para obtener el icono según el tipo
  const getTypeIcon = (type) => {
    if (type === 'classification') return '🎯';
    if (type === 'segmentation') return '✂️';
    if (type === 'comparison') return '⚖️';
    return '❓';
  };

  if (loading) return <div style={{textAlign: 'center', padding: '40px'}}>⏳ Cargando historial...</div>;
  if (error) return <div style={{padding: '20px', color: 'red', textAlign: 'center'}}>{error}</div>;

  return (
    <div className="view-content">
      
      {/* --- Encabezado de Estadísticas --- */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '15px', 
          marginBottom: '30px' 
        }}>
          <StatCard 
            label="Total Análisis" 
            value={stats.total_predictions} 
            color="#3b82f6" 
          />
          <StatCard 
            label="Clasificaciones" 
            value={stats.by_type?.classification || 0} 
            color="#e63946" 
          />
          <StatCard 
            label="Segmentaciones" 
            value={stats.by_type?.segmentation || 0} 
            color="#10b981" 
          />
        </div>
      )}

      {/* --- Lista de Historial --- */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Últimos Análisis</h3>
          <button onClick={loadData} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}>🔄</button>
        </div>

        {history.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No hay registros todavía. ¡Empieza a analizar imágenes!
          </div>
        ) : (
          <div>
            {history.map((item) => (
              <div key={item._id} className="history-item" style={{ 
                padding: '15px 20px', 
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                transition: 'background 0.2s'
              }}>
                {/* Icono Tipo */}
                <div style={{ 
                  fontSize: '1.5rem', 
                  background: '#f8fafc', 
                  width: '50px', 
                  height: '50px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: '50%' 
                }}>
                  {getTypeIcon(item.type)}
                </div>

                {/* Detalles Principales */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: '#334155', textTransform: 'capitalize' }}>
                      {item.type}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    {item.type === 'classification' && (
                      <span>
                        Resultado: <strong>{item.result?.top_class}</strong> 
                        {' '}({(item.result?.top_confidence * 100).toFixed(1)}%)
                      </span>
                    )}
                    {item.type === 'segmentation' && (
                      <span>Se detectaron <strong>{item.result?.num_detections}</strong> objetos</span>
                    )}
                    {item.type === 'comparison' && (
                      <span>Comparación de {item.models?.length} modelos</span>
                    )}
                  </div>
                </div>

                {/* Modelo usado */}
                <div style={{ 
                  fontSize: '0.75rem', 
                  background: item.type === 'comparison' ? '#fef3c7' : '#e2e8f0', 
                  color: item.type === 'comparison' ? '#b45309' : '#475569',
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  minWidth: '80px',
                  textAlign: 'center'
                }}>
                  {item.type === 'comparison' 
                    ? 'COMPARACIÓN' 
                    : (item.model || 'YOLO')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Pequeño componente interno para las tarjetas de arriba
function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'white', padding: '15px', borderRadius: '10px', borderLeft: `4px solid ${color}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b' }}>{value}</div>
    </div>
  );
}