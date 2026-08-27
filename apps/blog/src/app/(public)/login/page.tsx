import LoginForm from '@/components/login/LoginForm';

/**
 * /login — 서버 컴포넌트 셸(정적 프리렌더).
 * 서버 redirect 를 두지 않는다 — 백엔드 장애 시에도 로그인 폼이 떠야 하고, 프로필 이중 조회와
 * admin 가드와의 판정 기준 불일치(/admin↔/login 루프)를 피한다. 인증 상태 판정은 LoginForm 의 effect 가 맡는다.
 */
export default function LoginPage() {
  return <LoginForm />;
}
