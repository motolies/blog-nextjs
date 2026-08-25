'use client';

import { Badge, Field, Input, parseIsoDate, toIsoDate } from '@hvy/ui';
import { useEffect, useState } from 'react';

/**
 * parseIsoDate · toIsoDate — **문자열 계약의 경계**.
 *
 * 값의 계약이 `YYYY-MM-DD` 문자열이라(URL·FormData 가 전부 문자열을 주고받는다)
 * Date 는 로컬 y/m/d 계산에만 쓰고 값으로는 들고 다니지 않는다. 이 두 함수가 그 경계다.
 *
 * 검증 포인트:
 * · toIsoDate 는 **로컬** y/m/d 로 만든다 — `toISOString()` 을 쓰면 한국 시간대에서
 *   자정 직후가 **전날로 밀린다**(아래 대조 줄에서 확인)
 * · parseIsoDate 는 형식이 어긋나거나(`2026/01/01`) 존재하지 않는 날짜(`2026-02-31`)면 null 이다 —
 *   Date 가 오버플로를 조용히 3월 3일로 굴리는 것을 막는다
 * · 왕복(parse → toIso)이 원문과 같은지 확인한다
 */

/**
 * 자정 직후 — UTC 변환 시 전날로 밀리는 시각이다.
 *
 * ⚠️ `new Date(y, m, d, ...)` 는 **로컬 타임존** 기준이라 서버(UTC)와 브라우저(KST)에서
 * 다른 순간을 가리킨다 — 그 결과인 `toISOString()` 을 렌더에 넣으면 hydration mismatch 가 난다.
 * 이 데모가 증명하려는 현상이 데모 자신을 깨뜨리는 셈이라, 아래에서 **마운트 후에만** 계산한다.
 */
const MIDNIGHT = new Date(2026, 6, 15, 0, 30, 0);

const SAMPLES = ['2026-07-15', '2026-02-31', '2026/01/01', '2026-13-01', ''];

export function CalendarIsoUtilsDemo() {
  const [input, setInput] = useState('2026-02-31');

  const parsed = parseIsoDate(input);
  const roundTrip = parsed ? toIsoDate(parsed) : null;

  /** 브라우저 타임존에서만 의미가 있는 대조 — 서버 렌더 결과에 넣지 않는다. */
  const [tzCompare, setTzCompare] = useState<{ local: string; utc: string; zone: string } | null>(
    null,
  );
  useEffect(() => {
    setTzCompare({
      local: toIsoDate(MIDNIGHT),
      utc: MIDNIGHT.toISOString().slice(0, 10),
      zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, []);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <section className="flex flex-col gap-2">
        <Field
          label="parseIsoDate 입력"
          htmlFor="iso-input"
          help="형식·존재하지 않는 날짜를 넣어 보세요"
        >
          <Input id="iso-input" value={input} onChange={(event) => setInput(event.target.value)} />
        </Field>
        <dl className="flex flex-col gap-1 text-dl-xs">
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 font-dl-mono text-dl-fg-muted">parseIsoDate</dt>
            <dd>
              {parsed === null ? (
                <Badge tone="danger" size="xs">
                  null
                </Badge>
              ) : (
                <span className="font-dl-mono text-dl-fg">{parsed.toString().slice(0, 15)}</span>
              )}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-32 shrink-0 font-dl-mono text-dl-fg-muted">왕복 결과</dt>
            <dd className="font-dl-mono text-dl-fg">
              {roundTrip ?? '—'}{' '}
              {roundTrip !== null && (
                <Badge tone={roundTrip === input ? 'success' : 'warning'} size="xs">
                  {roundTrip === input ? '원문과 같음' : '원문과 다름'}
                </Badge>
              )}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLES.map((sample) => (
            <button
              key={sample || '(빈 문자열)'}
              type="button"
              onClick={() => setInput(sample)}
              className="rounded-dl-badge border border-dl-border px-2 py-0.5 font-dl-mono text-dl-xs text-dl-fg-muted hover:bg-dl-option-hover"
            >
              {sample === '' ? '(빈 문자열)' : sample}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-1 rounded-dl-control bg-dl-canvas p-3">
        <h4 className="text-dl-xs font-semibold text-dl-fg-strong">
          toIsoDate vs toISOString — 2026-07-15 00:30 (로컬)
        </h4>
        {tzCompare === null ? (
          // 서버 렌더에는 값을 넣지 않는다 — 두 계산이 타임존에 따라 갈리기 때문이다.
          <p className="text-dl-xs text-dl-fg-muted">브라우저 타임존을 읽는 중…</p>
        ) : (
          <>
            <p className="font-dl-mono text-dl-xs text-dl-fg">toIsoDate(d) = {tzCompare.local}</p>
            <p className="font-dl-mono text-dl-xs text-dl-fg-muted">
              d.toISOString().slice(0,10) = {tzCompare.utc}
            </p>
            <p className="text-dl-xs text-dl-fg-muted">
              현재 타임존 {tzCompare.zone} 기준.{' '}
              {tzCompare.local === tzCompare.utc
                ? 'UTC 와 같은 지역이라 두 값이 일치한다 — KST(+09:00) 에서는 갈린다.'
                : '두 값이 다르다 — UTC 로 바꾸면 하루가 밀린다. 그래서 값 변환에 toISOString 을 쓰지 않는다.'}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
