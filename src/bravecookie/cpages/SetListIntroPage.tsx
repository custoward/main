import React from 'react';
import { useHistory } from 'react-router-dom';
import './SetListIntroPage.css';

const SetListIntroPage: React.FC = () => {
  const history = useHistory();

  const handleLeftClick = () => {
    history.push('/bravecookie/setlistday');
  };

  const handleRightClick = () => {
    history.push('/bravecookie/setlistnight');
  };

  return (
    <div className="split-screen">
      <div className="half-screen day" onClick={handleLeftClick}>
        <div className="intro">
          <h1 className="large-text">晝</h1>
          <p className="description">1부, 여름 낮</p>
        </div>
      </div>
      <div className="half-screen night" onClick={handleRightClick}>
        <div className="intro">
          <h1 className="large-text">夜</h1>
          <p className="description">2부, 여름 밤</p>
        </div>
      </div>
    </div>
  );
};

export default SetListIntroPage;