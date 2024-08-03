import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import '../App.css';

const BravecookieMain: React.FC = () => {
  const [fade, setFade] = useState('fade-in');
  const [showMain, setShowMain] = useState(true);
  const [expand, setExpand] = useState('');
  const history = useHistory();

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade('fade-out');
      setTimeout(() => {
        setShowMain(false);
        setFade('fade-in'); // split-screen이 페이드 인 되도록 설정
      }, 1000); // fade-out 애니메이션 시간과 일치시킴
    }, 3000); // 3초 후에 글씨가 사라짐

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (expand) {
      if (expand === 'day') {
        document.body.style.backgroundColor = 'white';
        document.body.style.color = 'black';
      } else if (expand === 'night') {
        document.body.style.backgroundColor = 'black';
        document.body.style.color = 'white';
      }
    }
  }, [expand]);

  const handleExpand = (screen: string) => {
    if (screen === 'day') {
      document.body.style.backgroundColor = 'white';
      document.body.style.color = 'black';
    } else if (screen === 'night') {
      document.body.style.backgroundColor = 'black';
      document.body.style.color = 'white';
    }
    setExpand(screen);
    setTimeout(() => {
      setFade('fade-out'); // 반대쪽 타이틀을 즉시 숨기도록 설정
      setTimeout(() => {
        setTimeout(() => {
          if (screen === 'day') {
            history.push('/daylist');
          } else {
            history.push('/nightlist');
          }
        }, 1000); // 중앙에 글자가 1초 동안 유지되도록 설정
      }, 1000); // 확장 애니메이션 시간과 일치시킴
    }, 0); // 클릭 후 스타일이 변경된 후 바로 확장 시작
  };

  return (
    <div className={`bravecookie-container ${fade}`}>
      {showMain ? (
        <div className="intro">
          <h1 className="large-text">夏</h1>
          <p className="description">2024 용감한 쿠키 정기공연</p>
        </div>
      ) : (
        <div className={`split-screen ${fade}`}>
          <div
            className={`half-screen day ${expand === 'day' ? 'expand' : ''}`}
            onClick={() => handleExpand('day')}
          >
            <div className={`intro ${expand === 'day' ? 'expand-intro' : ''}`}>
              <h1 className="large-text">晝</h1>
              <p className="description">1부, 여름 낮</p>
            </div>
          </div>
          <div
            className={`half-screen night ${expand === 'night' ? 'expand' : ''}`}
            onClick={() => handleExpand('night')}
          >
            <div className={`intro ${expand === 'night' ? 'expand-intro' : ''}`}>
              <h1 className="large-text">夜</h1>
              <p className="description">2부, 여름 밤</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BravecookieMain;