import { useState } from 'react';
import axios from 'axios';
import { UploadZone } from '../Shared/UploadZone';
import { ResultCard } from '../Results/ResultCard';

// Ajusta si tu puerto es diferente
const API_URL = 'http://localhost:5000/api';

export function SegmentationView() {
  const [file, setFile] = useState(null);
  const [confidence, setConfidence] = useState(0.25); // Valor por defecto recomendado
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSegment = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conf', confidence);

    try {
      const response = await axios.post(`${API_URL}/segment`, formData);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError('Error al segmentar. Verifica que el modelo YOLO esté cargado en el backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-content">
      {/* --- Controles Específicos de Segmentación --- */}
      <div className="controls-section" style={{ marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <label style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span>🎚️ Sensibilidad de Detección</span>
          <span style={{ color: '#e63946' }}>{confidence}</span>
        </label>
        
        <input 
          type="range" 
          min="0.1" 
          max="0.9" 
          step="0.05" 
          value={confidence}
          onChange={(e) => setConfidence(parseFloat(e.target.value))}
          style={{ width: '100%', cursor: 'pointer', accentColor: '#e63946' }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
          <span>Detectar TODO (Más ruido)</span>
          <span>Solo lo seguro (Más estricto)</span>
        </div>
      </div>

      <UploadZone onFileSelect={setFile} selectedFile={file} />

      <button 
        className="btn-primary" 
        onClick={handleSegment}
        disabled={!file || loading}
      >
        {loading ? '✂️ Cortando y Analizando...' : '🔍 Segmentar Tomates'}
      </button>

      {error && <div style={{ padding: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginTop: '20px' }}>❌ {error}</div>}

      {/* --- Resultados --- */}
      {result && (
        <div className="results-grid" style={{ marginTop: '30px', display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          
          {/* Resultado Visual */}
          <ResultCard title="Mapa de Detección" highlight={true}>
            <div style={{ textAlign: 'center', overflow: 'hidden', borderRadius: '8px' }}>
              {/* Usamos la URL de la API para cargar la imagen generada */}
              <img 
                src={`${API_URL}/image/${result.result_image}`} 
                alt="Segmentation Result" 
                style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <p style={{ marginTop: '10px', color: '#64748b', fontSize: '0.85rem' }}>
                ⚡ Procesado en {result.processing_time}
              </p>
            </div>
          </ResultCard>

          {/* Lista de Objetos */}
          <ResultCard title={`Objetos Encontrados: ${result.num_detections}`}>
             {result.detections.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                 <span style={{ fontSize: '2rem', display: 'block' }}>🤷‍♂️</span>
                 <p>No se encontraron objetos. Prueba bajando la sensibilidad.</p>
               </div>
             ) : (
               <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                 {result.detections.map((det, idx) => (
                   <div key={idx} style={{ 
                     display: 'flex', 
                     justifyContent: 'space-between', 
                     padding: '12px', 
                     borderBottom: '1px solid #f1f5f9',
                     alignItems: 'center',
                     backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white'
                   }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <span style={{ background: '#e2e8f0', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>
                         {idx + 1}
                       </span>
                       <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{det.class_name}</span>
                     </div>
                     
                     <span style={{ 
                       background: det.confidence > 0.8 ? '#dcfce7' : '#fff7ed', 
                       color: det.confidence > 0.8 ? '#15803d' : '#c2410c', 
                       padding: '4px 10px', 
                       borderRadius: '20px', 
                       fontSize: '0.8rem', 
                       fontWeight: 'bold' 
                     }}>
                       {(det.confidence * 100).toFixed(0)}%
                     </span>
                   </div>
                 ))}
               </div>
             )}
          </ResultCard>

        </div>
      )}
    </div>
  );
}