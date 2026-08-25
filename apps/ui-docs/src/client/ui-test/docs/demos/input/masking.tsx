'use client';

import { Button, Field, FormGrid, Input } from '@hvy/ui';
import { type FormEvent, useState } from 'react';

/**
 * masking — 서버가 이미 마스킹해 내려준 개인정보 값의 **선언**(클라이언트 변환이 아니다).
 *
 * 볼 것:
 * · 마스킹 칸은 잠금 배색 + 기울임(`--color-dl-masked`) — 실값이 아님을 시각으로 알린다
 * · **FormData 덤프에 email·remoteAddr 키 자체가 없다** — masking 은 `name` 을 전달하지 않아
 *   마스킹된 값(a***@b.com)이 저장 요청에 실려 실값을 파괴하는 사고를 구조적으로 막는다.
 *   서버 계약이 "키 없음 = 변경 없음"(부분 갱신)일 때만 안전한 이유이기도 하다 —
 *   전체 치환 계약이라면 빠진 키가 곧 "빈 값으로 덮어쓰기"가 되므로 이 방어가 뒤집힌다
 * · 일반 칸(author)은 그대로 실린다 — 마스킹 칸만 선별적으로 빠진다
 * · 언마스킹으로 원문을 받아 교체하면 `masking={false}` 로 되돌린다 — 그때부터 다시 전송된다
 *
 * 접속 IP 를 예로 든 이유: 블로그에도 마스킹 대상이 실제로 있다 —
 * `apps/blog/src/pages/admin/system-log.tsx` 와 `api-log.tsx` 가 `remoteAddr` 를 컬럼으로 그린다.
 */
export function InputMaskingDemo() {
  const [dump, setDump] = useState('');

  const showFormData = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = [...new FormData(event.currentTarget).entries()]
      .map(([key, entry]) => `${key}=${String(entry)}`)
      .join(' · ');
    setDump(entries === '' ? '(비어 있음)' : entries);
  };

  return (
    <form onSubmit={showFormData} className="flex w-full max-w-xl flex-col gap-4">
      <FormGrid>
        <Field label="작성자" htmlFor="mk-author">
          <Input id="mk-author" name="author" defaultValue="김민준" />
        </Field>
        <Field label="이메일" htmlFor="mk-email" help="마스킹 — name 미전달, 전송에서 빠진다">
          {/* 서버가 내려준 값 그대로다 — masking 이 readOnly 를 걸어 onChange 없이도 안전하다 */}
          <Input id="mk-email" name="email" masking value="a***@b.com" />
        </Field>
        <Field label="접속 IP" htmlFor="mk-ip" help="마스킹 — 대역 외 ***">
          <Input id="mk-ip" name="remoteAddr" masking value="192.168.***.***" />
        </Field>
      </FormGrid>

      <div className="flex items-center gap-1.5">
        <Button type="submit" variant="outline-primary">
          FormData 덤프
        </Button>
      </div>
      {dump === '' ? null : (
        // 폼이 실제로 실어 보내는 값 — author 만 있고 email·remoteAddr 키는 존재하지 않아야 한다.
        <p className="text-dl-xs text-dl-fg-subtle">
          전송값: <code className="font-dl-mono">{dump}</code>
        </p>
      )}
    </form>
  );
}
