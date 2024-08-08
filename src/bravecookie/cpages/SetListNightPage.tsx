import React from 'react';
import CookieHeader from '../ccomponents/CookieHeader';
import CookieFooter from '../ccomponents/CookieFooter';
import './SetListNightPage.css';
import { Helmet } from 'react-helmet-async';

const SetListNightPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>용감한쿠키 2024</title>
        <link rel="icon" href="/favicon.ico?v=1" sizes="16x16" />
      </Helmet>
      <CookieHeader />
      <main className="setlist-night-content">
        <h1>2부 곡 리스트</h1>
        <ul>
          <li>곡명 10 - 작곡가 10</li>
          <li>곡명 11 - 작곡가 11</li>
          <li>곡명 12 - 작곡가 12</li>
          <li>곡명 13 - 작곡가 13</li>
          <li>곡명 14 - 작곡가 14</li>
          <li>곡명 15 - 작곡가 15</li>
          <li>곡명 16 - 작곡가 16</li>
          <li>곡명 17 - 작곡가 17</li>
          <li>곡명 18 - 작곡가 18</li>
        </ul>
      </main>
      <CookieFooter />
    </>
  );
};

export default SetListNightPage;