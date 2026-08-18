import { Button, Field, Input } from '@hvy/ui';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const { isLoading, error, login, setError, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

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
    <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
      <h1 className="visually-hidden">로그인</h1>
      <form noValidate onSubmit={handleSubmit} className="mt-1 p-10 w-full max-w-sm space-y-4">
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
