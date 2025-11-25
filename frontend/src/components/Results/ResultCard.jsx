export function ResultCard({ title, children, highlight = false }) {
  return (
    <div className={`result-card ${highlight ? 'highlight-card' : ''}`}>
      {title && (
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: '#64748b', 
          fontSize: '0.9rem', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em' 
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}