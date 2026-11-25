/* ==========================================================
   script.js : 모바일 청첩장 동작 코드
   ----------------------------------------------------------
   [목차]
   0. 자주 쓰는 도구 (함수)
   1. 봉투 인트로 열기          (U4 setTimeout)
   2. 햄버거 메뉴 열고 닫기      (U3 classList.toggle)
   3. 히어로 슬라이드            (U5 setInterval, U6 clearInterval)
   4. D-Day 카운트다운          (U5 setInterval)
   5. 갤러리 확대 모달
   6. 계좌 아코디언 + 복사       (U3 classList.toggle)
   7. 참석 여부 폼 검사          (U7 유효성 검사)
   8. 축하 메시지 불러오기       (D1~D5 fetch, async/await, JSON, DOM 생성, try...catch)
   9. 실행 시작 (맨 아래)
   ----------------------------------------------------------
   [읽는 법]
   - HTML에서 요소를 찾을 때 class는 .이름 , id는 #이름 으로 써요.
     예) document.querySelector('.envelope')  → class="envelope" 인 첫 번째 요소
   - classList.add('x')    : 클래스 x 붙이기
     classList.remove('x') : 클래스 x 떼기
     classList.toggle('x') : 있으면 떼고, 없으면 붙이기
   - 이 파일은 index.html에서 <script src="script.js" defer> 로 연결돼 있어서
     HTML이 다 만들어진 뒤에 실행돼요.
   ========================================================== */


/* ==========================================================
   0. 자주 쓰는 도구
   ========================================================== */

// 숫자를 두 자리로 맞추는 함수. 例) 5 → "05"
function padZero(number) {
  return String(number).padStart(2, '0');
}


/* ==========================================================
   1. 봉투 인트로 (U4 setTimeout)
   흐름: 왁스 클릭 → envelope--open 붙임(CSS 모션 시작)
         → 2.2초 뒤(setTimeout) envelope--done 붙임(봉투 사라짐) → 본문 보임
   ========================================================== */
function initEnvelope() {
  const envelope = document.querySelector('.envelope');
  const seal = document.querySelector('.envelope__seal');
  if (!envelope || !seal) return;   // 요소가 없으면 아무것도 안 하고 끝내요 (오류 방지)

  // 봉투가 떠 있는 동안 뒤의 본문이 스크롤되지 않게 잠가요 (CSS의 body.is-locked)
  document.body.classList.add('is-locked');

  // 봉투를 여는 시간 설정 (밀리초: 1000 = 1초)
  // CSS에서 마지막 모션(편지 올라옴)이 0.7초 대기 + 0.8초 이동 = 1.5초 → 여유 있게 2.2초
  const OPEN_DURATION = 2200;

  seal.addEventListener('click', function () {
    envelope.classList.add('envelope--open');   // CSS가 열림 모션을 시작해요

    // U4: 일정 시간이 지난 뒤 한 번만 실행
    setTimeout(function () {
      envelope.classList.add('envelope--done');          // 봉투가 서서히 사라짐
      document.body.classList.remove('is-locked');       // 스크롤 잠금 해제
      window.scrollTo(0, 0);                             // 맨 위에서 시작
    }, OPEN_DURATION);
  });
}


/* ==========================================================
   2. 햄버거 메뉴 (U3 classList.toggle)
   - 768px 이하에서만 햄버거가 보여요 (CSS에서 처리)
   - 누르면 nav에 nav--open 이 붙었다 떼졌다 해요
   ========================================================== */
function initNav() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('#main-nav');
  if (!hamburger || !nav) return;

  // 메뉴를 열고 닫는 함수. 햄버거의 aria-expanded 값도 같이 맞춰요 (스크린리더용)
  function setMenu(isOpen) {
    nav.classList.toggle('nav--open', isOpen);   // 두 번째 값이 true면 붙이고, false면 뗌
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
  }

  // 햄버거 버튼 클릭: 지금 열려 있으면 닫고, 닫혀 있으면 열기
  hamburger.addEventListener('click', function () {
    const isOpen = nav.classList.contains('nav--open');
    setMenu(!isOpen);
  });

  // 메뉴 링크를 누르면(섹션으로 이동하면) 메뉴를 닫아요
  nav.addEventListener('click', function (event) {
    if (event.target.closest('.nav__link')) {
      setMenu(false);
    }
  });

  // Esc 키를 눌러도 닫혀요
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setMenu(false);
  });
}


/* ==========================================================
   3. 히어로 슬라이드 (U5 setInterval, U6 clearInterval)
   - 3초마다 다음 사진으로 넘어가요
   - "멈춤" 버튼을 누르면 clearInterval 로 멈추고, 다시 누르면 재생
   ========================================================== */



/* ==========================================================
   4. D-Day 카운트다운 (U5 setInterval)
   - HTML의 data-date="2027-10-16T14:00:00" 값을 읽어서 남은 시간을 계산해요
   - 1초마다 숫자를 새로 써 줘요
   ========================================================== */
function initDday() {
  const grid = document.querySelector('.dday__grid');
  if (!grid) return;

  // data-date 값을 읽어서 날짜 객체로 변환
  const targetTime = new Date(grid.dataset.date).getTime();   // 밀리초 단위 숫자

  const daysEl = document.querySelector('#dday-days');
  const hoursEl = document.querySelector('#dday-hours');
  const minutesEl = document.querySelector('#dday-minutes');
  const secondsEl = document.querySelector('#dday-seconds');

  function update() {
    let diff = targetTime - Date.now();   // 남은 시간 (밀리초)
    if (diff < 0) diff = 0;               // 날짜가 지났으면 0으로 고정

    // 밀리초를 일/시/분/초로 나누기 (Math.floor = 소수점 버림)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    daysEl.textContent = days;
    hoursEl.textContent = padZero(hours);
    minutesEl.textContent = padZero(minutes);
    secondsEl.textContent = padZero(seconds);
  }

  update();                  // 처음 한 번 바로 표시 (1초 기다리지 않게)
  setInterval(update, 1000); // 이후 1초마다 갱신
}


/* ==========================================================
   5. 갤러리 확대 모달
   - 사진(button.gallery__item)을 누르면 큰 사진이 떠요
   - 닫기: ✕ 버튼 / 어두운 배경 클릭 / Esc 키
   ========================================================== */
function initModal() {
  const modal = document.querySelector('.modal');
  const modalImg = document.querySelector('.modal__img');
  const closeButton = document.querySelector('.modal__close');
  const prevButton = document.querySelector('.modal__nav--prev');
  const nextButton = document.querySelector('.modal__nav--next');
  const countEl = document.querySelector('.modal__count');
  const items = Array.from(document.querySelectorAll('.gallery__item'));   // 갤러리 사진들을 배열로
  if (!modal || !modalImg || !closeButton || items.length === 0) return;

  let current = 0;          // 지금 보이는 사진 번호 (0부터 시작)
  let lastFocused = null;   // 모달을 열기 전에 포커스가 있던 곳

  // n번째 사진을 보여주는 함수
  function showPhoto(index) {
    // 마지막 다음은 처음으로, 처음 이전은 마지막으로 (% 나머지 연산)
    current = (index + items.length) % items.length;

    const item = items[current];
    const thumb = item.querySelector('.gallery__img');

    modalImg.src = item.dataset.full;   // HTML의 data-full 값
    modalImg.alt = thumb.alt;           // 작은 사진의 설명(alt) 사용 (A3)
    if (countEl) countEl.textContent = (current + 1) + ' / ' + items.length;
  }

  function openModal(index) {
    lastFocused = items[index];
    showPhoto(index);
    modal.classList.add('modal--open');
    closeButton.focus();
  }

  function closeModal() {
    modal.classList.remove('modal--open');
    if (lastFocused) lastFocused.focus();
  }

  // 갤러리 사진 클릭 → 그 번호의 사진으로 열기
  items.forEach(function (item, index) {
    item.addEventListener('click', function () {
      openModal(index);
    });
  });

  closeButton.addEventListener('click', closeModal);

  // 이전/다음 버튼
  if (prevButton) prevButton.addEventListener('click', function () { showPhoto(current - 1); });
  if (nextButton) nextButton.addEventListener('click', function () { showPhoto(current + 1); });

  // 어두운 배경을 누르면 닫기
  modal.addEventListener('click', function (event) {
    if (event.target === modal) closeModal();
  });

  // 키보드: Esc 닫기, ← 이전, → 다음
  document.addEventListener('keydown', function (event) {
    if (!modal.classList.contains('modal--open')) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowLeft') showPhoto(current - 1);
    if (event.key === 'ArrowRight') showPhoto(current + 1);
  });

  // 스와이프: 손가락을 누른 위치(startX)와 뗀 위치를 비교해요
  let startX = 0;

  modal.addEventListener('touchstart', function (event) {
    startX = event.changedTouches[0].clientX;
  }, { passive: true });

  modal.addEventListener('touchend', function (event) {
    const diff = event.changedTouches[0].clientX - startX;   // 양수: 오른쪽으로 밀기, 음수: 왼쪽으로 밀기
    if (Math.abs(diff) < 50) return;                         // 50px보다 적게 움직이면 그냥 터치로 봐요
    if (diff < 0) {
      showPhoto(current + 1);   // 왼쪽으로 밀면 다음 사진
    } else {
      showPhoto(current - 1);   // 오른쪽으로 밀면 이전 사진
    }
  }, { passive: true });
}


/* ==========================================================
   6. 계좌 아코디언 + 복사 (U3 classList.toggle)
   - 신랑측/신부측 버튼을 누르면 패널이 열리고 닫혀요
   - "복사" 버튼은 계좌번호를 클립보드에 복사해요
   ========================================================== */
function initAccordion() {
  const triggers = document.querySelectorAll('.accordion__trigger');

  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      // aria-controls 값(예: "panel-groom")과 같은 id를 가진 패널 찾기
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;

      // U3: 클래스를 토글해요. toggle은 붙였으면 true, 뗐으면 false를 돌려줘요.
      const isOpen = panel.classList.toggle('accordion__panel--open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
  });

  // ----- 복사 버튼 -----
  const copyButtons = document.querySelectorAll('.accordion__copy');

  copyButtons.forEach(function (button) {
    button.addEventListener('click', async function () {
      // 같은 패널 안에 있는 안내 문구 자리 찾기
      const message = button.parentElement.querySelector('.accordion__message');

      try {
        // data-account 값 = 복사할 계좌번호
        await navigator.clipboard.writeText(button.dataset.account);
        message.textContent = '복사되었어요';
      } catch (error) {
        // 복사 기능이 막힌 환경(예: 일부 브라우저, http 주소)에서는 안내만
        message.textContent = '복사하지 못했어요. 직접 선택해서 복사해 주세요.';
      }

      // 2초 뒤에 안내 문구 지우기 (setTimeout)
      setTimeout(function () {
        message.textContent = '';
      }, 2000);
    });
  });
}


/* ==========================================================
   7. 참석 여부 폼 (U7 유효성 검사)
   - 이름이 비었거나 참석 여부를 안 골랐으면 경고 문구를 보여줘요
   - 모두 통과하면 감사 문구를 보여줘요
   - 주의: 지금은 서버가 없어서 입력한 내용이 어디로 전송되지는 않아요.
   ========================================================== */
function initForm() {
  const form = document.querySelector('#rsvp-form');
  if (!form) return;

  const nameInput = document.querySelector('#rsvp-name');
  const result = form.querySelector('.form__result');

  // 입력창 바로 아래의 오류 문구(<p class="form__error">)를 찾는 함수
  function getErrorBox(element) {
    return element.closest('.form__group').querySelector('.form__error');
  }

  // 오류 문구를 지우는 함수
  function clearError(element) {
    getErrorBox(element).textContent = '';
    if (element.tagName === 'INPUT' && element.type === 'text') {
      element.classList.remove('form__input--error');
      element.removeAttribute('aria-invalid');
    }
  }

  // 오류 문구를 보여주는 함수
  function showError(element, text) {
    getErrorBox(element).textContent = text;
    if (element.tagName === 'INPUT' && element.type === 'text') {
      element.classList.add('form__input--error');
      element.setAttribute('aria-invalid', 'true');   // 스크린리더에게 "잘못된 입력"이라고 알려줘요
    }
  }

  // 입력을 시작하면 이전 오류 문구는 바로 지워 줘요
  nameInput.addEventListener('input', function () {
    clearError(nameInput);
  });
  form.querySelectorAll('input[name="attend"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      clearError(radio);
    });
  });

  // 제출 버튼을 눌렀을 때
  form.addEventListener('submit', function (event) {
    event.preventDefault();       // 페이지가 새로고침되는 기본 동작을 막아요
    result.textContent = '';

    let isValid = true;           // 지금까지 문제가 없는지 표시

    // ① 이름 검사: trim()은 앞뒤 공백을 지워요. "   " 같은 공백만 입력도 빈 값으로 처리됨
    const name = nameInput.value.trim();
    if (name === '') {
      showError(nameInput, '이름을 입력해 주세요.');
      isValid = false;
    } else {
      clearError(nameInput);
    }

    // ② 참석 여부 검사: 선택된 radio 찾기
    const attendInput = form.querySelector('input[name="attend"]:checked');
    const firstRadio = form.querySelector('input[name="attend"]');
    if (!attendInput) {
      showError(firstRadio, '참석 여부를 선택해 주세요.');
      isValid = false;
    } else {
      clearError(firstRadio);
    }

    // 문제가 있으면 첫 번째 잘못된 칸으로 이동하고 끝내요
    if (!isValid) {
      if (name === '') {
        nameInput.focus();
      } else {
        firstRadio.focus();
      }
      return;
    }

    // ③ 모두 통과: 선택한 값 읽어서 안내 문구 만들기
    const guests = form.querySelector('#rsvp-guests').value;
    const hasMeal = form.querySelector('#rsvp-meal').checked;

    if (attendInput.value === 'yes') {
      result.textContent =
        name + '님, 참석 의사가 전달되었어요. (' + guests + '명' +
        (hasMeal ? ', 식사 참석' : '') + ') 감사합니다.';
    } else {
      result.textContent = name + '님, 마음만 받을게요. 소중한 답변 감사합니다.';
    }

    form.reset();   // 입력창 비우기
  });
}


/* ==========================================================
   8. 축하 메시지 불러오기 (D1~D5)
   - D1 fetch()        : data.json 파일을 가져와요
   - D2 async/await    : "기다렸다가 다음 줄 실행"을 읽기 쉽게 쓰는 방법
   - D3 response.json(): 가져온 글자를 JS 객체로 바꿔요
   - D4 DOM 생성       : 반복문으로 <li>를 만들어 화면에 붙여요
   - D5 try...catch    : 실패하면 안내 문구를 보여줘요
   ========================================================== */
async function loadMessages() {
  const list = document.querySelector('.messages__list');
  const errorBox = document.querySelector('.messages__error');
  if (!list || !errorBox) return;

  try {
    // D1 + D2: 파일을 가져올 때까지 기다려요 (await)
    const response = await fetch('data.json');

    // 주소가 틀렸거나 서버 오류(404 등)면 직접 오류를 만들어 catch 로 보내요
    if (!response.ok) {
      throw new Error('data.json을 불러오지 못했어요. 상태 코드: ' + response.status);
    }

    // D3: JSON 글자를 JS 객체로 변환 (이것도 기다려야 해요)
    const data = await response.json();

    // D4: 기존 샘플 <li>를 지우고, 가져온 데이터로 새로 만들어요
    list.innerHTML = '';

    data.messages.forEach(function (item) {
      const li = document.createElement('li');
      li.className = 'messages__item';

      const name = document.createElement('h3');
      name.className = 'messages__name';
      name.textContent = item.name;     // textContent: 글자 그대로 넣어요 (안전)

      const text = document.createElement('p');
      text.className = 'messages__text';
      text.textContent = item.text;

      const date = document.createElement('time');
      date.className = 'messages__date';
      date.setAttribute('datetime', item.date);                 // 2027-09-20
      date.textContent = item.date.replaceAll('-', '.');        // 화면에는 2027.09.20

      // li 안에 이름 → 본문 → 날짜 순서로 넣고, 마지막에 ul 에 붙여요
      li.append(name, text, date);
      list.append(li);
    });

    errorBox.hidden = true;   // 성공했으니 오류 문구는 숨김

  } catch (error) {
    // D5: 어디선가 실패하면 여기로 와요
    console.error(error);     // 개발자 도구(F12)의 Console 에서 원인을 볼 수 있어요
    errorBox.textContent =
      '축하 메시지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
    errorBox.hidden = false;  // hidden 을 풀어서 안내 문구를 보여줘요
  }
}

/* ==========================================================
   스크롤 등장 효과
   - 아래 목록의 요소를 처음에 투명하게 만들어 두고,
     화면에 들어오면 reveal--visible 을 붙여 서서히 보이게 해요.
   - 효과를 넣고 싶은 요소가 있으면 목록에 '.클래스이름' 을 추가하세요.
   ========================================================== */
function initReveal() {
  // 옛 브라우저라 기능이 없으면 아무것도 하지 않아요 (글자가 계속 보이게)
  if (!('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll(
    '.section-title, .greeting__text, .greeting__family, .dday__grid, ' +
    '.slider, .info__list, .map, .account__intro, .accordion, ' +
    '.rsvp__intro, .form, .messages__intro, .messages__list, .footer__text'
  );

  // 감시자: 요소가 화면에 10% 이상 보이면 실행돼요
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');   // 서서히 나타남
        observer.unobserve(entry.target);                // 한 번 나타나면 더 이상 감시 안 함
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(function (element) {
    element.classList.add('reveal');   // 처음엔 투명하게
    observer.observe(element);         // 화면에 들어오는지 지켜보기 시작
  });
}
/* ==========================================================
   9. 실행 시작
   위에서 만든 함수들을 여기서 한 번씩 불러서 동작시켜요.
   하나가 오류가 나도 나머지가 멈추지 않게 이 순서로 호출해요.
   ========================================================== */
initEnvelope();
initNav();
initDday();
initModal();
initAccordion();
initForm();
loadMessages();
initReveal();

// ===== 슬라이드 갤러리 =====
(function () {
  const slides = document.querySelectorAll('.slider__slide');
  const thumbs = document.querySelectorAll('.slider__thumb');
  const toggleBtn = document.querySelector('.slider__toggle');
  if (slides.length === 0) return;

  const INTERVAL = 3000;   // 3초마다 넘어가요
  let current = 0;
  let timer;
  let isPlaying = true;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('slider__slide--active', i === current));
    thumbs.forEach((t, i) => {
      t.classList.toggle('slider__thumb--active', i === current);
      t.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  }

  function start() {
    clearInterval(timer);
    timer = setInterval(() => show(current + 1), INTERVAL);
  }

  function stop() {
    clearInterval(timer);   // U6: 자동 반복 중단
  }

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      show(i);
      if (isPlaying) start();   // 멈춤 상태면 다시 시작하지 않아요
    });
  });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) { start(); } else { stop(); }
      toggleBtn.textContent = isPlaying ? '멈춤' : '재생';
      toggleBtn.setAttribute('aria-label', isPlaying ? '자동 넘김 멈춤' : '자동 넘김 재생');
    });
  }

  show(0);
  start();
})();