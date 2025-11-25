export function ConfidenceBar({ value, label, percentText }) {
  // value debe ser entre 0 y 1 (ej: 0.95)
  const percentage = (value * 100).toFixed(1);
  
  return (
    <div className="confidence-item" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
        <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{label}</span>
        <span style={{ color: '#64748b' }}>{percentText || `${percentage}%`}</span>
      </div>
      
      <div className="confidence-bar">
        <div 
          className="confidence-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}