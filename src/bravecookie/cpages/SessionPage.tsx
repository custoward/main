import React from 'react';
import CookieHeader from '../ccomponents/CookieHeader';
import CookieFooter from '../ccomponents/CookieFooter';
import './SessionPage.css';
import { Helmet } from 'react-helmet';

const SessionPage: React.FC = () => {
  return (
    <>
         <Helmet>
        <title>용감한쿠키 2024</title>
        <link rel="icon" type="image/png" href="../favicon.ico?v=1" sizes="16x16" />
      </Helmet>
      <CookieHeader />
      <main className="session-content">
        <div className="session-header">
          <h1>서울대학교 조소과 밴드 용감한쿠키</h1>
          <p>최고의 선남선녀만 모여있다는 소문이?</p>
        </div>
        <div className="session-body">
          <div className="team">
            <h2>1팀 소개</h2>
            <p>짧은 설명</p>
            <p>드럼: 홍길동</p>
            <p>보컬: (밴드구성원 참조하여 채우길 바람)</p>
          </div>
          <div className="team">
            <h2>2팀 소개</h2>
            <p>짧은 설명</p>
            <p>드럼: 홍길동</p>
            <p>보컬: (밴드구성원 참조하여 채우길 바람)</p>
          </div>
        </div>
      </main>
      <CookieFooter />
    </>
  );
};

export default SessionPage;