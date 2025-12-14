const imageContainer = document.getElementById('imageContainer');
const captionBox = document.getElementById('captionBox');
const animatedTitle = document.getElementById('animatedTitle');
const koreanTitle = document.getElementById('koreanTitle');
const headerBackground = document.getElementById('headerBackground');

// 영문 타이틀 애니메이션 생성
const titleText = 'TYPO MOSS';
titleText.split('').forEach((char, index) => {
  const span = document.createElement('span');
  span.className = 'letter';
  span.textContent = char;
  span.style.animationDelay = `${Math.random() * -5}s`;
  span.style.animationDuration = `${4 + Math.random() * 2}s`;
  animatedTitle.appendChild(span);
});

// 한글 타이틀 애니메이션 생성
const koreanText = '타이포 이끼';
koreanText.split('').forEach((char, index) => {
  const span = document.createElement('span');
  span.className = 'letter';
  span.textContent = char;
  span.style.animationDelay = `${Math.random() * -5}s`;
  span.style.animationDuration = `${4 + Math.random() * 2}s`;
  koreanTitle.appendChild(span);
});

// 스크롤 이벤트로 헤더 크기 조절
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// JSON 불러오기
fetch('imageData.json')
  .then(response => response.json())
  .then(imageData => {

    imageData.forEach((data, index) => {
      // 반응형에 따라 텍스트 블록 위치 결정
      const width = window.innerWidth;
      let textBlockIndex;
      if (width <= 400) textBlockIndex = 3; // 1열: 4-5번
      else if (width <= 600) textBlockIndex = 6; // 2열: 7-8번
      else if (width <= 900) textBlockIndex = 7; // 3열: 8-9번
      else if (width <= 1200) textBlockIndex = 10; // 4열: 11-12번
      else textBlockIndex = 13; // 5열: 14-15번
      
      if (index === textBlockIndex) {
        const textBlock = document.createElement('div');
        textBlock.className = 'text-block';
        textBlock.innerHTML = `
          <p>도시 틈새에는 스티커 군락이 야금야금 자란다. 그 모습은 이상하게 정겹다. 비에 젖어도 띁겨도 다시 생겨나는 걸 보고 있으면 그냥 도시의 작은 이끼 같다. 스쳐 지나가던 그 작은 군락 안에는 생각보다 많은 삶이 웅크리고 있었다.</p>
          <p class="credit">타이포그래피2, 김민성</p>
        `;
        imageContainer.appendChild(textBlock);
      }
      
      const img = document.createElement('img');
      img.src = `image/${data.file}`;
      img.alt = data.title;

      // 마우스호버시 캡션 띄우기
      img.addEventListener('mouseenter', () => {
        captionBox.innerHTML = `<div style="font-size: 1.05em; font-weight: 900; margin-bottom: 4px; word-break: break-all; font-family: 'Jua', 'Rubik Bubbles', helvetica, sans-serif;">${data.title}</div><div style="font-size: 0.9em; word-break: break-all;">${data.caption}</div>`;
        captionBox.style.display = 'block';
      });

      // 마우스가 움직일 때 위치 업데이트
      img.addEventListener('mousemove', (e) => {
        captionBox.style.left = `${e.clientX + 10}px`;
        captionBox.style.top = `${e.clientY + 10}px`;
      })

      img.addEventListener('mouseleave', () => {
        captionBox.style.display = 'none';
      });

      imageContainer.appendChild(img);
    });

  })
  .catch(error => console.error('JSON 불러오기 오류:', error));

// Essay Modal 기능
const essayModal = document.getElementById('essayModal');
const modalClose = document.querySelector('.essay-modal-close');
const qrSection = document.getElementById('qrSection');
const essayTitle = document.getElementById('essayTitle');

// 에세이 제목 애니메이션 생성
const essayTitleEnglish = 'TYPO MOSS';
const essayTitleKorean = '타이포 이끼';

const englishSpan = essayTitle.children[0];
essayTitleEnglish.split('').forEach((char) => {
  const span = document.createElement('span');
  span.className = 'letter';
  span.textContent = char;
  span.style.animationDelay = `${Math.random() * -5}s`;
  span.style.animationDuration = `${4 + Math.random() * 2}s`;
  englishSpan.appendChild(span);
});

const koreanSpan = essayTitle.children[1];
essayTitleKorean.split('').forEach((char) => {
  const span = document.createElement('span');
  span.className = 'letter';
  span.textContent = char;
  span.style.animationDelay = `${Math.random() * -5}s`;
  span.style.animationDuration = `${4 + Math.random() * 2}s`;
  koreanSpan.appendChild(span);
});

// QR 섹션 클릭 시 모션포스터 페이지 열기
qrSection.addEventListener('click', (e) => {
  e.stopPropagation();
  window.open('/typomoss', '_blank');
});

// 헤더 클릭 시 모달 열기
header.addEventListener('click', () => {
  essayModal.style.display = 'flex';
});

// 닫기 버튼 클릭
modalClose.addEventListener('click', (e) => {
  e.stopPropagation();
  essayModal.style.display = 'none';
});

// 모달 배경 클릭 시 닫기
essayModal.addEventListener('click', (e) => {
  if (e.target === essayModal) {
    essayModal.style.display = 'none';
  }
});
