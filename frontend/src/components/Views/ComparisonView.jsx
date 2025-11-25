import { useState } from 'react';
import axios from 'axios';
import { UploadZone } from '../Shared/UploadZone';
import { ResultCard } from '../Results/ResultCard';
import { ConfidenceBar } from '../Results/ConfidenceBar';

// Detectamos si estamos en "localhost" o en la web real
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Si es local usa el 5000, si es web usa Render (URL fija)
const API_URL = isLocal 
  ? 'http://localhost:5000/api' 
  : 'https://leandroramirez1-tomato-backend.hf.space/api';

console.log("🌍 Entorno detectado:", isLocal ? "Local" : "Producción");
console.log("🔗 Conectando a:", API_URL);

export function ComparisonView() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('top_k', 3); // Pedimos el top 3 de cada modelo

    try {
      const response = await axios.post(`${API_URL}/compare`, formData);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError('Error al comparar modelos. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para encontrar qué modelo tuvo la mayor confianza (para resaltarlo)
  const getBestModel = (comparisons) => {
    let bestModel = '';
    let maxConf = 0;
    Object.entries(comparisons).forEach(([name, res]) => {
      if (res.top_confidence > maxConf) {
        maxConf = res.top_confidence;
        bestModel = name;
      }
    });
    return bestModel;
  };

  return (
    <div className="view-content">
      <div style={{ textAlign: 'center', marginBottom: '20px', color: '#64748b' }}>
        <p>Enviaremos esta imagen a <strong>todos los modelos disponibles</strong> para ver cuál es más preciso.</p>
      </div>

      <UploadZone onFileSelect={setFile} selectedFile={file} />

      <button 
        className="btn-primary" 
        onClick={handleCompare}
        disabled={!file || loading}
      >
        {loading ? '⚖️ Consultando al jurado...' : '🚀 Iniciar Debate de IA'}
      </button>

      {error && <div style={{ padding: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginTop: '20px' }}>❌ {error}</div>}

      {/* --- Resultados de la Comparación --- */}
      {result && result.comparisons && (
        <div style={{ marginTop: '30px' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#94a3b8' }}>
            ⏱️ Procesado en {result.processing_time} | Modelos consultados: {result.models_compared}
          </div>

          <div className="results-grid" style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            
            {/* Iteramos sobre cada modelo devuelto */}
            {Object.entries(result.comparisons).map(([modelName, modelResult]) => {
              const isWinner = modelName === getBestModel(result.comparisons);
              
              return (
                <ResultCard 
                  key={modelName} 
                  title={`Opinión de ${modelName}`} 
                  highlight={isWinner}
                >
                  <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'capitalize', color: '#1e293b' }}>
                      {modelResult.top_class}
                    </div>
                    <div style={{ 
                      display: 'inline-block', 
                      marginTop: '5px',
                      padding: '2px 10px', 
                      borderRadius: '12px', 
                      background: isWinner ? '#dcfce7' : '#f1f5f9',
                      color: isWinner ? '#15803d' : '#64748b',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {(modelResult.top_confidence * 100).toFixed(2)}% Seguridad
                    </div>
                  </div>

                  {/* Barras de las otras predicciones de este modelo */}
                  {modelResult.predictions.map((pred, idx) => (
                    <ConfidenceBar 
                      key={idx}
                      label={pred.class}
                      value={pred.confidence}
                      percentText={pred.confidence_percent}
                    />
                  ))}
                </ResultCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}