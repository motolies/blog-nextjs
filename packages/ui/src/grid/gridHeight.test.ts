import { describe, expect, it } from 'vitest';
import { resolveEmptyBodyHeight, resolveGridMaxHeight } from './gridHeight';

/** md 밀도(행 40 / 헤더 40)를 흉내 낸 실측값 — 값 자체는 임의고 계산 규칙만 본다. */
const METRICS = { rowHeight: 40, headerHeight: 40 } as const;

describe('resolveGridMaxHeight', () => {
  it('숫자는 그대로 px 상한이다', () => {
    expect(resolveGridMaxHeight(420, METRICS)).toBe(420);
  });

  it("'auto' 와 'fill' 은 둘 다 상한이 없다 — 차이는 컨테이너 클래스에서 갈린다", () => {
    expect(resolveGridMaxHeight('auto', METRICS)).toBeNull();
    expect(resolveGridMaxHeight('fill', METRICS)).toBeNull();
  });

  it('{ rows: N } 은 헤더 + N행이다', () => {
    expect(resolveGridMaxHeight({ rows: 5 }, METRICS)).toBe(240);
  });

  it('합계행이 있으면 그만큼 더한다 — 합계행은 스크롤 영역 안 sticky 라 한 줄을 먹는다', () => {
    expect(resolveGridMaxHeight({ rows: 5 }, { ...METRICS, footerHeight: 40 })).toBe(280);
  });

  it('rows 가 0·음수·NaN 이면 1행으로 정규화한다 — 헤더만 남은 표를 만들지 않는다', () => {
    expect(resolveGridMaxHeight({ rows: 0 }, METRICS)).toBe(80);
    expect(resolveGridMaxHeight({ rows: -3 }, METRICS)).toBe(80);
    expect(resolveGridMaxHeight({ rows: Number.NaN }, METRICS)).toBe(80);
  });

  it('rows 소수는 내림한다 — 행이 반쯤 잘려 보이면 안 된다', () => {
    expect(resolveGridMaxHeight({ rows: 2.9 }, METRICS)).toBe(120);
  });
});

describe('resolveEmptyBodyHeight', () => {
  it('상한이 없으면(auto·fill) 5행이다', () => {
    expect(resolveEmptyBodyHeight(null, METRICS)).toBe(200);
  });

  it('상한이 작아도 2행 아래로는 내려가지 않는다 — 문구+힌트+액션의 최소치', () => {
    expect(resolveEmptyBodyHeight(120, METRICS)).toBe(80);
  });

  it('상한 안이면 헤더를 뺀 값이다', () => {
    expect(resolveEmptyBodyHeight(200, METRICS)).toBe(160);
  });

  it('상한이 커도 5행에서 멈춘다 — 빈 표가 화면을 다 먹지 않는다', () => {
    expect(resolveEmptyBodyHeight(1000, METRICS)).toBe(200);
  });
});
