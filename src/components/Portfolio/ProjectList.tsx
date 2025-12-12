import React, { useState } from 'react';
import ProjectModal from './ProjectModal';
import './style.css';

export type Project = {
  id: string;
  title: string;
  englishTitle?: string;
  date?: string;
  description?: string;
  type?: 'image' | 'video' | 'canvas' | 'embed';
  src?: string;
};

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: '타이포 이끼',
    englishTitle: 'typo moss',
    date: '25/11',
    description: '도시에 자라나는 이끼같은 작은 타이포그래피들',
    type: 'canvas'
  },
  {
    id: 'proj-2',
    title: '숨은 도시',
    englishTitle: 'breath hidden city',
    date: '25/10',
    description: '반응형 모션 타이포. 숨들이 모여 이루어지는 도시.',
    type: 'canvas'
  }
];

const ProjectList: React.FC = () => {
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <section className="portfolio-list">
      <h1 className="portfolio-heading">Projects</h1>

      <ul className="project-items">
        {SAMPLE_PROJECTS.map((p) => {
          // 특정 프로젝트는 페이지 이동
          const hasRoute = p.id === 'proj-1' || p.id === 'proj-2';
          const route = p.id === 'proj-1' ? '/typomoss' : '/breath-hidden-city';
          
          return (
            <li
              key={p.id}
              className="project-item"
              onClick={(e) => {
                if (hasRoute) {
                  window.location.href = route;
                  return;
                }
                setSelected(p);
              }}
            >
              <div className="receipt">
                <div className="receipt-row">
                  <div>
                    <div className="receipt-title">{p.title}</div>
                    {p.englishTitle && <div className="receipt-english">{p.englishTitle}</div>}
                  </div>
                  <div className="receipt-date">{p.date}</div>
                </div>
                <div className="receipt-desc">{p.description}</div>
              </div>
            </li>
          );
        })}
      </ul>

      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </section>
  );
};

export default ProjectList;
