const ProjectsSkeleton = () => (
  <div className="page-content">
    <div className="projects-header">
      <div className="skeleton skeleton-title" style={{ width: '200px' }}></div>
      <div className="project-header-actions">
        <div className="skeleton skeleton-btn"></div>
      </div>
    </div>
    <div className="skeleton-project-grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card" style={{ height: '200px', padding: '20px' }}>
          <div className="skeleton" style={{ width: '60%', height: '24px', marginBottom: '15px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '15px', marginBottom: '8px' }}></div>
          <div className="skeleton" style={{ width: '80%', height: '15px', marginBottom: '20px' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div className="skeleton" style={{ width: '30%', height: '12px' }}></div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="skeleton" style={{ width: '25px', height: '25px', borderRadius: '50%' }}></div>
              <div className="skeleton" style={{ width: '25px', height: '25px', borderRadius: '50%' }}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ProjectsSkeleton;