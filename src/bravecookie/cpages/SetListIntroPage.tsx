import React from 'react';
import { useHistory } from 'react-router-dom';
import './SetListIntroPage.css';
import { Helmet } from 'react-helmet-async';

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
      <Helmet>
        <title>용감한쿠키 2024</title>
        <meta property="og:title" content="용감한쿠키 2024 여름 정기공연" />
        <meta property="og:description" content="여름의 낮, 여름의 밤" />
        <link rel="icon" href="/faviconTwo.ico?v=2" />
      </Helmet>
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