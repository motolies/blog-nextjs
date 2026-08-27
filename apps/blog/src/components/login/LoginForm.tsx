'use client';

import { Button, Field, Input } from '@hvy/ui';
import { useRouter } from 'next/navigation';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * 로그인 폼(클라이언트) — (public)/login/page.tsx 가 렌더한다. 인증 상태 판정은 서버가 아닌 이 컴포넌트의 effect 가 맡는다.
 */
export default function LoginForm() {
  const router = useRouter();
  const { isLoading, error, login, setError, clearError } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // 이미 인증됐거나(AuthBootstrap 결과) 방금 로그인에 성공하면 /admin 으로.
  // router.replace 만으로 충분: (public)→admin 세그먼트 교체라 admin/layout 이 새로 페치되고 방금 Set-Cookie 된 토큰을 읽는다
  useEffect(() => {
    if (isAuthenticated === true) router.replace('/admin');
  }, [isAuthenticated, router]);

  const onChangeUsername = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const onChangePassword = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onClickLogin();
  };

  const onClickLogin = () => {
    if (username.length === 0 || password.length === 0) {
      setError('Username and password are required');
      return;
    }

    login(username, password);
  };

  return (
    <div className="public-container flex min-h-[50dvh] items-center justify-center">
      <h1 className="visually-hidden">로그인</h1>
      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-1 w-full max-w-sm space-y-4 p-6 sm:p-10"
      >
        <Field label="UserName" htmlFor="username">
          <Input
            id="username"
            name="username"
            autoComplete="username"
            autoFocus
            onChange={onChangeUsername}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            onChange={onChangePassword}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                onClickLogin();
              }
            }}
          />
        </Field>
        <Button
          variant="primary"
          busy={isLoading}
          type="submit"
          className="w-full mt-3"
          onClick={onClickLogin}
        >
          Login
        </Button>
        {error !== '' && (
          <div className="bg-dl-danger-bg border border-dl-danger-border text-dl-danger-ink rounded-md px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
