// 기기(브라우저)별 영속 식별자. 로그인 없이 "내가 올린 그림"을 구분하는 용도.
const KEY = 'chair-theory-client-id';

export function getClientId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = `c-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // localStorage 비활성(시크릿 등) 시 임시값
    return 'anon';
  }
}
