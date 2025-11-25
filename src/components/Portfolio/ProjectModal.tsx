import React, { useEffect } from 'react';
import './style.css';

type Project = {
  id: string;
  title: string;
  englishTitle?: string;
  date?: string;
  description?: string;
  type?: 'image' | 'video' | 'canvas' | 'embed';
  src?: string; // image path or video embed url
};

const ProjectModal: React.FC<{
  project: Project | null;
  onClose: () => void;
}> = ({ project, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!project) return null;

  return (
    <div className="portfolio-modal" role="dialog" aria-modal="true">
      <div className="portfolio-modal-overlay" onClick={onClose} />
      <div className="portfolio-modal-content">
        <button className="portfolio-modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="receipt-left">
          <h2 className="project-title">{project.title}</h2>
          {project.englishTitle && <div className="project-english">{project.englishTitle}</div>}
          {project.date && <div className="project-date">{project.date}</div>}
          {project.description && <p className="project-desc">{project.description}</p>}
        </div>

        <div className="receipt-right">
          {project.type === 'image' && project.src && (
            <img src={project.src} alt={project.title} className="project-media" />
          )}

          {project.type === 'video' && project.src && (
            <div className="video-wrapper">
              <iframe
                title={project.title}
                src={project.src}
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {project.type === 'embed' && project.src && (
            <div className="embed-wrapper" dangerouslySetInnerHTML={{ __html: project.src }} />
          )}

          {project.type === 'canvas' && (
            <div className="canvas-placeholder">Canvas / WebGL content can be mounted here</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
