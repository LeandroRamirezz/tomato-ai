import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { ClassificationView } from './components/Views/ClassificationView';
import { SegmentationView } from './components/Views/SegmentationView';
import { ComparisonView } from './components/Views/ComparisonView';
import { HistoryView } from './components/Views/HistoryView';

console.log("Ambiente:", import.meta.env.MODE);
console.log("API URL detectada:", import.meta.env.VITE_API_URL);

// URL del Backend
const API_URL = 'http://localhost:5000/api';

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
    <div className="app-container">
      <header className="app-header">
        <h1>🍅 TomatoAI</h1>
        <p>Sistema Inteligente de Clasificación Agrícola</p>
        {serverStatus === 'offline' && (
          <span style={{background: '#fee2e2', color: '#ef4444', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem'}}>
            ⚠️ Backend desconectado
          </span>
        )}
      </header>

      <main className="main-card">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'classification' ? 'active' : ''}`}
            onClick={() => setActiveTab('classification')}
          >
            🎯 Clasificación
          </button>
          <button 
            className={`tab-btn ${activeTab === 'segmentation' ? 'active' : ''}`}
            onClick={() => setActiveTab('segmentation')}
          >
            ✂️ Segmentación
          </button>
          <button 
              className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
              onClick={() => setActiveTab('comparison')}
            >
              ⚖️ Comparar
            </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Historial
          </button>
        </div>

        <div style={{ padding: '30px' }}>
          {activeTab === 'classification' && (
            <ClassificationView models={models} />
          )}
          
          {activeTab === 'segmentation' && (
            <SegmentationView />
          )}
          {activeTab === 'comparison' && (
            <ComparisonView />
          )}
          {activeTab === 'history' && (
            <HistoryView />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;