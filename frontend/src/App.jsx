import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { ClassificationView } from './components/Views/ClassificationView';
import { SegmentationView } from './components/Views/SegmentationView';
import { ComparisonView } from './components/Views/ComparisonView';
import { HistoryView } from './components/Views/HistoryView';

// Detectamos si estamos en "localhost" o en la web real
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Si es local usa el 5000, si es web usa Render (URL fija)
const API_URL = isLocal 
  ? 'http://localhost:5000/api' 
  : 'https://leandroramirez1-tomato-backend.hf.space/api';

console.log("🌍 Entorno detectado:", isLocal ? "Local" : "Producción");
console.log("🔗 Conectando a:", API_URL);

function App() {
  const [activeTab, setActiveTab] = useState('classification');
  const [models, setModels] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking'); // checking, online, offline

  // Cargar modelos al iniciar
  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`${API_URL}/models`);
        setModels(res.data.classification_models || []);
        setServerStatus('online');
      } catch (err) {
        console.error("Error conectando al backend:", err);
        setServerStatus('offline');
      }
    };
    init();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍅 TomatoAI</h1>
        <p>Sistema Inteligente de Clasificación Agrícola</p>
        <div className="header-stats">
          {serverStatus === 'online' && (
            <span style={{color: '#2a9d8f', display: 'flex', alignItems: 'center', gap: '5px'}}>
              ● Conectado
            </span>
          )}
          {serverStatus === 'offline' && (
            <span style={{color: '#e63946', display: 'flex', alignItems: 'center', gap: '5px'}}>
              ● Backend desconectado
            </span>
          )}
          {serverStatus === 'checking' && (
            <span style={{color: '#457b9d', display: 'flex', alignItems: 'center', gap: '5px'}}>
              ● Conectando...
            </span>
          )}
        </div>
      </header>

      <div className="container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'classification' ? 'active' : ''}`}
            onClick={() => setActiveTab('classification')}
          >
            🎯 Clasificación
          </button>
          <button 
            className={`tab ${activeTab === 'segmentation' ? 'active' : ''}`}
            onClick={() => setActiveTab('segmentation')}
          >
            ✂️ Segmentación
          </button>
          <button 
            className={`tab ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
          >
            ⚖️ Comparar
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Historial
          </button>
        </div>

        <div className="content">
          {activeTab === 'classification' && (
            <ClassificationView models={models} apiUrl={API_URL} />
          )}
          
          {activeTab === 'segmentation' && (
            <SegmentationView apiUrl={API_URL} />
          )}
          
          {activeTab === 'comparison' && (
            <ComparisonView apiUrl={API_URL} />
          )}
          
          {activeTab === 'history' && (
            <HistoryView apiUrl={API_URL} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;