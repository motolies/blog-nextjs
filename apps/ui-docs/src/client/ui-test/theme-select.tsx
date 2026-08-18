'use client';

import { Select } from '@hvy/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { DEFAULT_THEME, normalizeTheme, THEMES } from '../../shared/theme';

const OPTIONS = THEMES.map((name) => ({ value: name, label: name }));

/**
 * 테마 전환기 — 진실 소스는 URL query(`?theme=`)다.
 *
 * onValueChange 에서 dataset 을 즉시 갱신하는 이유: router.replace 는 서버 왕복이
 * 없어도 렌더 사이클을 거치므로, 속성을 먼저 바꿔야 클릭 즉시 색이 바뀐다.
 * effect 는 URL→dataset 재동기화 담당 — 뒤로가기·주소창 직접 편집은 layout 의
 * 인라인 스크립트가 재실행되지 않아 이 effect 가 유일한 방어선이다.
 * default 는 query 를 지워 URL 을 깨끗하게 유지한다(사이드바 링크 전파와 동일 규칙).
 */
export function ThemeSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = normalizeTheme(searchParams.get('theme'));

  useEffect(() => {
    if (theme === DEFAULT_THEME) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleChange = (value: string) => {
    const next = normalizeTheme(value);
    if (next === DEFAULT_THEME) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;

    const params = new URLSearchParams(searchParams);
    if (next === DEFAULT_THEME) params.delete('theme');
    else params.set('theme', next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // label 이 아닌 이유: Select 트리거가 <button> 이라 label-컨트롤 연결이 성립하지 않는다(a11y 규칙).
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-dl-xs font-semibold text-dl-fg-muted">테마</span>
      <Select value={theme} onValueChange={handleChange} options={OPTIONS} placeholder="테마" />
    </div>
  );
}
