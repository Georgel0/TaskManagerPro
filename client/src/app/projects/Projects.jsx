'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/context';
import './projects.css';

export default function Projects() {
  const { user } = useApp();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/';
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch projects');
        
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading || !user) {
    return (
      <div className='loading-state'>
        <div className="pulse-ring"></div>
        <p>Loading Projects...</p>
      </div>
    );
  }

  return (
  <div className="page-content projects-page">
      <div className="projects-header">
        <h2><i className="fas fa-folder-open"></i> My Projects</h2>
        <button className="btn btn-primary">
          <i className="fas fa-plus"></i> New Project
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {projects.length === 0 ? (
        <div className="card projects-empty-state">
          <i className="fas fa-folder-plus projects-empty-icon"></i>
          <p>You don't have any projects yet. Create one to get started</p>
          <br />
          <button className="btn btn-primary">
            <i className="fas fa-plus"></i> New
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="card dashboard-card project-card">
              <div className="card-header project-card-header">
                <h3>{project.name}</h3>
                {project.owner_id === user.id ? (
                  <span className="badge badge-owner">Owner</span>
                ) : (
                  <span className="badge badge-member">Member</span>
                )}
              </div>
              <div className="card-body">
                <p className="project-description">
                  {project.description || 'No description provided.'}
                </p>
                <div className="project-meta">
                  <i className="fas fa-calendar-alt"></i> Created: {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}