import React from 'react';
import CookieHeader from '../ccomponents/CookieHeader';
import CookieFooter from '../ccomponents/CookieFooter';
import './EventPage.css';
import event from '../source/event.png'
import { Helmet } from 'react-helmet-async';

const EventPage: React.FC = () => {
  return (
    <>
      <Helmet>
      <title>용감한 쿠키 2024</title>
        <meta property="og:title" content="용감한 쿠키 2024" />
        <meta property="og:description" content="2024 정기 공연, 여름." />
        <link rel="icon" href="/faviconTwo.ico?v=2" sizes="16x16" />
        <meta property="og:site_name" content="davi-davi.com/bravecookie" />
      </Helmet>
      <CookieHeader />
      <main className="event-content">
        <h1 className="event-title">EVENT!</h1>
        <div className="event-image">
          <img src={event} width="100%"/> 
        </div>
        <div className="event-description-title">이벤트 타임!</div>
        <div className="event-description">공연 중간에 깜짝 이벤트를 준비했습니다</div>
        <div className="event-description">소정의 선물이 준비되어있으니 꼭 받아가세요!</div>
      </main>
      <CookieFooter />
    </>
  );
};

export default EventPage;