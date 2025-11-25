import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

// --- CONFIGURACIÓN DE CONEXIÓN ---
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal 
  ? 'http://localhost:5000/api' 
  : 'https://leandroramirez1-tomato-backend.hf.space/api';

console.log("🌍 Conectando a:", API_URL);

function App() {
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState('classification')
  const [models, setModels] = useState({ classification: [], segmentation: [] })
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [confidence, setConfidence] = useState(0.25)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // --- EFECTOS ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    
    loadModels();
    loadHistory();
    loadStats();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [])

  // --- CAMBIO DE PESTAÑA (NUEVO: LIMPIA RESULTADOS) ---
  const changeTab = (newTab) => {
    setActiveTab(newTab);
    setResult(null); // 🧹 Borrar resultado anterior
    setError(null);  // 🧹 Borrar errores anteriores
    
    // Si vamos al historial, recargamos los datos
    if (newTab === 'history') {
      loadHistory();
    }
  };

  // --- FUNCIONES DE CARGA ---
  const loadModels = async () => {
    try {
      const response = await axios.get(`${API_URL}/models`)
      setModels({
        classification: response.data.classification_models || [],
        segmentation: response.data.segmentation_models || []
      })
      if (response.data.classification_models?.length > 0) {
        setSelectedModel('mobilenetv2') 
      }
    } catch (err) {
      console.error('Error cargando modelos:', err)
      setError('No se pudo conectar con el servidor.')
    }
  }

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/predictions?limit=10`)
      setHistory(res.data.predictions || [])
    } catch (err) { console.error(err) }
  }

  const loadStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`)
      setStats(res.data)
    } catch (err) { console.error(err) }
  }

  // --- MANEJADORES ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setResult(null)
      setError(null)
    }
  }

  const clearAll = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
  }

  const handleAction = async (endpoint, formData) => {
    if (!selectedFile) return setError('⚠️ Por favor selecciona una imagen primero.')
    
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await axios.post(`${API_URL}/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
      loadHistory()
      loadStats()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Ocurrió un error al procesar la imagen.')
    } finally {
      setLoading(false)
    }
  }

  const onClassify = () => {
    if (!selectedModel) return setError("⚠️ No hay modelo seleccionado.");
    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('model', selectedModel)
    handleAction('classify', fd)
  }

  const onSegment = () => {
    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('conf', confidence)
    handleAction('segment', fd)
  }

  const onCompare = () => {
    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('top_k', 3)
    handleAction('compare', fd)
  }

  const navOptions = [
    { value: 'classification', label: '🎯 Clasificación' },
    { value: 'segmentation', label: '✂️ Segmentación' },
    { value: 'comparison', label: '⚖️ Comparar' },
    { value: 'history', label: '📜 Historial' }
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍅 TomatoAI</h1>
        <p>Sistema Inteligente de Análisis de Cultivos</p>
        {stats && (
          <div className="header-stats">
            <span>📊 Total: {stats.total_predictions}</span>
            <span>🤖 Modelos: {stats.available_models?.classification?.length || 0}</span>
          </div>
        )}
      </header>

      <div className="container">
        {/* --- NAVEGACIÓN --- */}
        {isMobile ? (
          <div className="mobile-nav-container">
            <select 
              className="mobile-nav-select" 
              value={activeTab} 
              onChange={(e) => changeTab(e.target.value)} // USAR NUEVA FUNCIÓN
            >
              {navOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        ) : (
          <div className="tabs">
            {navOptions.map(opt => (
              <button 
                key={opt.value} 
                className={`tab ${activeTab === opt.value ? 'active' : ''}`} 
                onClick={() => changeTab(opt.value)} // USAR NUEVA FUNCIÓN
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="content">
          {activeTab !== 'history' && (
            <div className="image-area-container" style={previewUrl ? {border: 'none', background: '#000'} : {}}>
              {!previewUrl ? (
                <label className="upload-placeholder">
                  <input type="file" accept="image/*" onChange={handleFileSelect} style={{display:'none'}} />
                  <span style={{fontSize: '40px'}}>📁</span>
                  <div className="btn btn-secondary">Seleccionar Imagen</div>
                </label>
              ) : (
                <div className="preview-container-wrapper">
                  <img src={previewUrl} alt="Preview" className="preview-image-main" />
                  <button className="close-btn" onClick={clearAll} title="Borrar imagen">✕</button>
                </div>
              )}
            </div>
          )}

          {/* --- CONTROLES --- */}
          {activeTab === 'classification' && (
            <div className="control-panel">
              <div className="model-selector">
                <label style={{fontWeight:'600', display:'block', marginBottom:'5px'}}>Modelo de IA:</label>
                {models.classification.length > 0 ? (
                  <select 
                    className="model-select" 
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {models.classification.map(m => (
                      <option key={m.name} value={m.name}>
                        {m.name.toUpperCase()} ({m.num_classes} clases)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p style={{color: 'orange'}}>⏳ Cargando modelos disponibles...</p>
                )}
              </div>
              <button 
                className="btn btn-primary" 
                onClick={onClassify} 
                disabled={!selectedFile || loading || models.classification.length === 0} 
                style={{marginTop: '20px'}}
              >
                {loading ? '⏳ Analizando...' : '🚀 Clasificar Imagen'}
              </button>
            </div>
          )}

          {activeTab === 'segmentation' && (
            <div className="control-panel">
              <div className="confidence-slider">
                <label style={{fontWeight:'600', display:'flex', justifyContent:'space-between'}}>
                  <span>Sensibilidad:</span><span>{confidence}</span>
                </label>
                <input type="range" min="0.1" max="0.9" step="0.05" value={confidence} onChange={(e) => setConfidence(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={onSegment} disabled={!selectedFile || loading} style={{marginTop: '20px'}}>
                {loading ? '✂️ Cortando...' : '✂️ Segmentar Tomates'}
              </button>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="control-panel">
              <p style={{textAlign:'center', marginBottom:'15px', color:'#666'}}>
                Enviaremos la imagen a <strong>todos</strong> los modelos disponibles.
              </p>
              <button className="btn btn-primary" onClick={onCompare} disabled={!selectedFile || loading}>
                {loading ? '⚖️ Comparando...' : '⚖️ Comparar Modelos'}
              </button>
            </div>
          )}

          {error && (
            <div className="error-message" style={{padding: '15px', color: '#721c24', background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', marginTop: '20px'}}>
              ❌ {error}
            </div>
          )}

          {result && (
            <div className="results" style={{marginTop: '30px'}}>
              {result.predictions && (
                <div className="result-card">
                  <h3 style={{borderBottom:'1px solid rgba(255,255,255,0.2)', paddingBottom:'10px', marginBottom:'15px'}}>Resultado</h3>
                  <div style={{fontSize:'2.5rem', fontWeight:'800', textTransform:'capitalize'}}>{result.top_class}</div>
                  <div style={{fontSize:'1.2rem', color:'#4ade80', fontWeight:'600'}}>
                    Confianza: {(result.top_confidence * 100).toFixed(1)}%
                  </div>
                  <div style={{marginTop:'20px', textAlign:'left', background:'rgba(0,0,0,0.2)', padding:'15px', borderRadius:'8px'}}>
                    <small style={{color:'#ccc', textTransform:'uppercase'}}>Otras posibilidades:</small>
                    {result.predictions.slice(1).map((p, idx) => (
                      <div key={idx} style={{display:'flex', justifyContent:'space-between', marginTop:'5px'}}>
                        <span>{p.class}</span><span>{p.confidence_percent}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.result_image && (
                <div className="result-card">
                  <h3>Mapa de Detección</h3>
                  <div className="result-image-container">
                    <img src={`${API_URL}/image/${result.result_image}`} alt="Segmented Result" className="result-image" />
                  </div>
                  <div style={{marginTop:'15px'}}>
                    <span style={{background:'#fff', color:'#333', padding:'5px 10px', borderRadius:'20px', fontWeight:'bold'}}>
                      🍅 {result.num_detections} tomates encontrados
                    </span>
                  </div>
                </div>
              )}

              {result.comparisons && (
                <div className="comparison-grid" style={{marginTop:'20px'}}>
                  {Object.entries(result.comparisons).map(([name, res]) => (
                    <div key={name} style={{background:'white', border:'1px solid #ddd', padding:'15px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}>
                      <h4 style={{margin:'0 0 10px 0', color:'#1d3557', textTransform:'uppercase'}}>{name}</h4>
                      <div style={{fontSize:'1.2rem', fontWeight:'bold', color:'#e63946'}}>{res.top_class}</div>
                      <div style={{color:'#2a9d8f', fontWeight:'600'}}>{(res.top_confidence * 100).toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- HISTORIAL MEJORADO --- */}
          {activeTab === 'history' && (
            <div className="history-list" style={{marginTop:'20px'}}>
              {history.length === 0 && <p style={{textAlign:'center', color:'#999'}}>No hay registros recientes.</p>}
              {history.map((h) => (
                <div key={h._id} className="history-item" style={{background:'white', padding:'15px', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:'15px'}}>
                  <div style={{fontSize:'1.5rem'}}>
                    {h.type === 'classification' ? '🎯' : h.type === 'segmentation' ? '✂️' : '⚖️'}
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div style={{fontWeight:'bold', textTransform:'capitalize'}}>{h.type}</div>
                      <div style={{fontSize:'0.75rem', background:'#eee', padding:'2px 8px', borderRadius:'10px', color:'#555'}}>
                        {/* AQUÍ MOSTRAMOS EL MODELO */}
                        🤖 {h.type === 'comparison' ? (h.models?.join(', ') || 'Varios') : (h.model || 'YOLO')}
                      </div>
                    </div>
                    <div style={{fontSize:'0.85rem', color:'#666', marginTop:'2px'}}>
                      {new Date(h.timestamp).toLocaleString()}
                    </div>
                    <div style={{marginTop:'5px'}}>
                      {h.result?.top_class && <span style={{color:'#e63946', fontWeight:'600'}}>Result: {h.result.top_class}</span>}
                      {h.result?.num_detections !== undefined && <span>Detectados: {h.result.num_detections}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default App