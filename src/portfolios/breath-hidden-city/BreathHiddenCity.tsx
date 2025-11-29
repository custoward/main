import React from 'react';
import './BreathHiddenCity.css';

const BreathHiddenCity: React.FC = () => {
  return (
    <div className="breath-page">
      <button 
        className="breath-back-button"
        onClick={() => window.location.href = '/portfolio'}
        title="포트폴리오 목록"
      >
        ←
      </button>
      <iframe
        title="숨은 도시"
        src="/portfolios/breath-hidden-city/index.html"
        className="breath-iframe"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
      />
    </div>
  );
};

export default BreathHiddenCity;
