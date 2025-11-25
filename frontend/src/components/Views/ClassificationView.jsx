import { useState } from 'react';
import axios from 'axios';
import { UploadZone } from '../Shared/UploadZone';

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

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', selectedModel);

    try {
      const response = await axios.post(`${API_URL}/classify`, formData);
      setResult(response.data);
    } catch (err) {
      setError('Error al clasificar. Revisa que el backend esté conectado.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-content">
      <div className="controls-section">
        {models.length > 0 && (
          <div className="select-wrapper" style={{ marginBottom: '20px' }}>
            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>
              Modelo de IA:
            </label>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}}
            >
              {models.map(m => (
                <option key={m.name} value={m.name}>
                  {m.name.toUpperCase()} ({m.num_classes} clases)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <UploadZone onFileSelect={setFile} selectedFile={file} />

      <button 
        className="btn-primary" 
        onClick={handleClassify}
        disabled={!file || loading}
      >
        {loading ? 'Analizando...' : '🔍 Identificar Tomate'}
      </button>

      {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}

      {result && (
        <div className="results-grid" style={{ marginTop: '30px' }}>
          <div className="result-card">
            <h3 style={{margin: 0, color: '#64748b'}}>Resultado Principal</h3>
            <p style={{fontSize: '2rem', fontWeight: 'bold', margin: '10px 0', textTransform: 'capitalize'}}>
              {result.top_class}
            </p>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <span style={{fontWeight: 'bold', color: '#e63946'}}>
                {(result.top_confidence * 100).toFixed(1)}%
              </span>
              Confianza
            </div>
          </div>
          
          <div className="result-card">
            <h4>Otras Posibilidades</h4>
            {result.predictions.map((pred, idx) => (
              <div key={idx} style={{marginBottom: '12px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem'}}>
                  <span style={{textTransform: 'capitalize'}}>{pred.class}</span>
                  <span>{pred.confidence_percent}</span>
                </div>
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{width: `${pred.confidence * 100}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}