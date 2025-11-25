import { useState, useId } from 'react';

export function UploadZone({ onFileSelect, selectedFile }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  
  // Generamos un ID único para este input específico
  const inputId = useId();

  // Generar previsualización inicial si ya hay archivo seleccionado
  if (selectedFile && !preview) {
    setPreview(URL.createObjectURL(selectedFile));
  }

  // --- Lógica de Eventos ---

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Solo desactivar si realmente salimos de la zona (no si entramos a un hijo)
    // El CSS pointer-events: none ayuda, pero esto es doble seguridad.
    if (e.currentTarget.contains(e.relatedTarget)) return;
    
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Es necesario mantener esto para permitir el "drop"
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  // Procesar archivo (común para Drop y Click)
  const handleFileProcess = (file) => {
    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor sube solo archivos de imagen');
      return;
    }
    
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onFileSelect(file);
  };

  const handleClear = (e) => {
    e.stopPropagation(); // Evitar que se abra el selector al borrar
    setPreview(null);
    onFileSelect(null);
  };

  return (
    <div 
      className={`upload-zone ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById(inputId).click()}
      style={{ position: 'relative' }} // Necesario para el botón de borrar
    >
      <input 
        type="file" 
        id={inputId} 
        hidden 
        accept="image/*"
        onChange={(e) => e.target.files[0] && handleFileProcess(e.target.files[0])} 
      />

      {preview ? (
        <div className="preview-container">
          <img src={preview} alt="Preview" className="preview-img" />
          <button className="btn-clear" onClick={handleClear}>×</button>
        </div>
      ) : (
        <div className="placeholder">
          <span className="icon" style={{fontSize: '3rem', display: 'block'}}>☁️</span>
          <p style={{margin: '10px 0', fontWeight: 'bold'}}>
            {isDragging ? '¡Suéltala ahora!' : 'Arrastra tu imagen aquí'}
          </p>
          <p style={{fontSize: '0.8rem', color: '#94a3b8'}}>
            o haz clic para buscar
          </p>
        </div>
      )}
    </div>
  );
}