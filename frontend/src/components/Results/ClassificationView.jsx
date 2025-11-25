import { useState } from 'react';
import axios from 'axios';
import { UploadZone } from '../Shared/UploadZone';
// Importamos los nuevos componentes
import { ResultCard } from '../Results/ResultCard';
import { ConfidenceBar } from '../Results/ConfidenceBar';

// Detectamos si estamos en "localhost" o en la web real
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Si es local usa el 5000, si es web usa Render (URL fija)
const API_URL = isLocal 
  ? 'http://localhost:5000/api' 
  : 'https://leandroramirezz-tomato-backend.hf.space/api';

console.log("🌍 Entorno detectado:", isLocal ? "Local" : "Producción");
console.log("🔗 Conectando a:", API_URL);

export function ClassificationView({ models }) {
  const [file, setFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState(models[0]?.name || 'resnet50');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleClassify = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null); // Limpiar resultado anterior

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', selectedModel);

    try {
      const response = await axios.post(`${API_URL}/classify`, formData);
      setResult(response.data);
    } catch (err) {
      setError('Error al clasificar. Revisa la conexión con el backend.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-content">
      {/* --- Controles --- */}
      <div className="controls-section" style={{marginBottom: '20px'}}>
        {models.length > 0 && (
           <select 
             value={selectedModel} 
             onChange={(e) => setSelectedModel(e.target.value)}
             className="model-select"
             style={{
               width: '100%', padding: '12px', borderRadius: '10px', 
               border: '1px solid #cbd5e1', backgroundColor: 'white',
               fontSize: '1rem'
             }}
           >
             {models.map(m => (
               <option key={m.name} value={m.name}>
                 🧠 Modelo: {m.name.toUpperCase()}
               </option>
             ))}
           </select>
        )}
      </div>

      <UploadZone onFileSelect={setFile} selectedFile={file} />

      <button 
        className="btn-primary" 
        onClick={handleClassify}
        disabled={!file || loading}
      >
        {loading ? '⏳ Analizando Imagen...' : '🚀 Clasificar Tomate'}
      </button>

      {error && <div style={{padding: '15px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginTop: '20px'}}>❌ {error}</div>}

      {/* --- Resultados Modulares --- */}
      {result && (
        <div className="results-grid" style={{ marginTop: '30px', display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          
          {/* Tarjeta 1: Resultado Principal */}
          <ResultCard title="Predicción Principal" highlight={true}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '10px' }}>🍅</span>
              <h2 style={{ margin: 0, fontSize: '2rem', textTransform: 'capitalize', color: '#1e293b' }}>
                {result.top_class}
              </h2>
              <div style={{ 
                display: 'inline-block', 
                background: '#dcfce7', 
                color: '#15803d', 
                padding: '5px 15px', 
                borderRadius: '20px', 
                marginTop: '10px', 
                fontWeight: 'bold' 
              }}>
                {(result.top_confidence * 100).toFixed(2)}% Confianza
              </div>
            </div>
          </ResultCard>
          
          {/* Tarjeta 2: Detalles y otras opciones */}
          <ResultCard title="Análisis Detallado">
            {result.predictions.map((pred, idx) => (
              <ConfidenceBar 
                key={idx}
                label={pred.class}
                value={pred.confidence}
                percentText={pred.confidence_percent}
              />
            ))}
          </ResultCard>

        </div>
      )}
    </div>
  );
}