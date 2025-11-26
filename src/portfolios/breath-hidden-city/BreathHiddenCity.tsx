import React from 'react';
import './BreathHiddenCity.css';

const BreathHiddenCity: React.FC = () => {
  return (
    <div className="breath-page">
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
