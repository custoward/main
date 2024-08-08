import React from 'react';
import CookieHeader from '../ccomponents/CookieHeader';
import CookieFooter from '../ccomponents/CookieFooter';
import './SessionPage.css';
import { Helmet } from 'react-helmet-async';

const SessionPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>용감한쿠키 2024</title>
        <meta property="og:title" content="용감한쿠키 2024 여름 정기공연" />
        <meta property="og:description" content="여름의 낮, 여름의 밤" />
        <link rel="icon" href="/faviconTwo.ico?v=2" />
      </Helmet>
      <CookieHeader />
      <main className="session-content">
        <div className="session-header">
          <h1>세션소개</h1>
        </div>
        <div className="session-body">
          <div className="team">
            <h2>1팀, 여름의 낮</h2>
            <div className="info">뜨겁고 생기넘치는 여름!</div>
            <div className="info">여름의 낮은 우리가 책임진다!</div>

            <div className='session'>보컬</div>
            <div className='name'>최종희</div>
            <div className='name'>송지우</div>
            <div className='name'>권우민</div>
            <div className='session'>기타</div>
            <div className='name'>한상혁</div>
            <div className='name'>이준서</div>
            <div className='name'>김태홍</div>
            <div className='session'>베이스</div>
            <div className='name'>김은수</div>
            <div className='name'>이준표</div>
            <div className='session'>건반</div>
            <div className='name'>임유현</div>
            <div className='session'>드럼</div>
            <div className='name'>김민성</div>

          </div>
          <div className="team">
            <h2>2팀, 여름의 밤</h2>
            <div className="info">밤이 찾아오면 파티가 기다린다!</div>
            <div className="info">여름의 밤을 화끈하게 불태워주지!</div >

            <div className='session'>보컬</div>
            <div className='name'>이재훈</div>
            <div className='name'>이나현</div>
            <div className='session'>기타</div>
            <div className='name'>최성윤</div>
            <div className='name'>홍기주</div>
            <div className='session'>베이스</div>
            <div className='name'>송지아</div>
            <div className='session'>건반</div>
            <div className='name'>이준석</div>
            <div className='session'>드럼</div>
            <div className='name'>정숭민</div>
          </div>
        </div>
      </main>
      <CookieFooter />
    </>
  );
};

export default SessionPage;