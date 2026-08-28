import { describe, expect, it } from 'vitest';
import { scalePoints, summarize, toAreaPath, toLinePath } from './chartScale';

const box = { w: 100, h: 28, pad: 2 };

describe('scalePoints', () => {
  it('빈 배열은 빈 결과 — 0으로 나누지 않는다', () => {
    expect(scalePoints([], box)).toEqual([]);
  });

  it('점이 하나면 가운데에 찍는다 (분모가 0이 되는 경계)', () => {
    const [point] = scalePoints([42], box);
    expect(point.x).toBe(50);
    expect(point.y).toBe(14);
  });

  it('값이 전부 같으면 세로 중앙에 평평한 선 — NaN 도 y=0 도 아니어야 한다', () => {
    const points = scalePoints([7, 7, 7], box);
    expect(points).toHaveLength(3);
    for (const point of points) {
      expect(Number.isNaN(point.y)).toBe(false);
      expect(point.y).toBe(14);
    }
  });

  it('최댓값이 위, 최솟값이 아래 — SVG y축은 아래로 증가한다', () => {
    const [low, high] = scalePoints([0, 10], box);
    expect(high.y).toBeLessThan(low.y);
  });

  it('x는 0에서 시작해 폭 끝까지 균등 분포한다', () => {
    const points = scalePoints([1, 2, 3], box);
    expect(points[0].x).toBe(0);
    expect(points[2].x).toBe(100);
  });
});

describe('toLinePath / toAreaPath', () => {
  it('점이 없으면 빈 문자열 — <path d=""> 는 아무것도 그리지 않는다', () => {
    expect(toLinePath([])).toBe('');
    expect(toAreaPath([], 28)).toBe('');
  });

  it('선은 M 으로 시작해 L 로 이어진다', () => {
    expect(
      toLinePath([
        { x: 0, y: 1 },
        { x: 10, y: 2 },
      ]),
    ).toBe('M0,1 L10,2');
  });

  it('영역은 baseline 으로 닫힌다', () => {
    const d = toAreaPath(
      [
        { x: 0, y: 1 },
        { x: 10, y: 2 },
      ],
      28,
    );
    expect(d.startsWith('M0,28')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });
});

describe('summarize', () => {
  it('빈 입력은 0으로 채우고 peak 은 null', () => {
    expect(summarize([])).toEqual({ min: 0, max: 0, last: 0, total: 0, avg: 0, peak: null });
  });

  it('최소·최대·합계·평균·마지막값·최고일을 계산한다', () => {
    const result = summarize([
      { label: '1일', value: 2 },
      { label: '2일', value: 8 },
      { label: '3일', value: 5 },
    ]);
    expect(result).toMatchObject({ min: 2, max: 8, last: 5, total: 15, avg: 5 });
    expect(result.peak).toEqual({ label: '2일', value: 8 });
  });

  it('전부 0이어도 peak 은 첫 항목을 가리킨다 (null 이 아니다)', () => {
    const result = summarize([
      { label: 'a', value: 0 },
      { label: 'b', value: 0 },
    ]);
    expect(result.peak).toEqual({ label: 'a', value: 0 });
  });
});
