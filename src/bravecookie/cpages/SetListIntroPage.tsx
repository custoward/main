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
      <title>용감한 쿠키 2024</title>
        <meta property="og:title" content="용감한 쿠키 2024" />
        <meta property="og:description" content="2024 정기 공연, 여름." />
        <link rel="icon" href="/faviconTwo.ico?v=2" sizes="16x16" />
        <meta property="og:site_name" content="davi-davi.com/bravecookie" />
        <meta property="og:image" content="ogimage.ipg" />
      </Helmet>
      <div className="half-screen day" onClick={handleLeftClick}>
        <div className="intro">
          <h1 className="large-text">晝</h1>
          <p className="description">1부, 여름의 낮</p>
        </div>
      </div>
      <div className="half-screen night" onClick={handleRightClick}>
        <div className="intro">
          <h1 className="large-text">夜</h1>
          <p className="description">2부, 여름의 밤</p>
        </div>
      </div>
    </div>
  );
};

export default SetListIntroPage;