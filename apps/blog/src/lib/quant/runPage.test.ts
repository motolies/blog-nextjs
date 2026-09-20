import { describe, expect, it } from 'vitest';
import type { SearchRequest } from '../gridSearch';
import { toRunPage } from './runPage';

const rows = [
  { runId: 3, startedAt: '2026-09-20T09:00:00Z', rowsUpserted: 30, status: 'SUCCESS' },
  { runId: 2, startedAt: '2026-09-19T09:00:00Z', rowsUpserted: 200, status: 'FAILED' },
  { runId: 1, startedAt: '2026-09-18T09:00:00Z', rowsUpserted: 100, status: 'SUCCESS' },
];

const request = (over: Partial<SearchRequest>): SearchRequest => ({
  page: 0,
  pageSize: 10,
  orderBy: [],
  ...over,
});

describe('toRunPage', () => {
  it('orderBy 가 없으면 서버 순서(startedAt DESC)를 유지하고 totalCount 는 전체 건수다', () => {
    const page = toRunPage(rows, request({ pageSize: 2 }));
    expect(page.list.map((r) => r.runId)).toEqual([3, 2]);
    expect(page.totalCount).toBe(3);
  });

  it('page 는 0-based 로 슬라이스한다', () => {
    expect(toRunPage(rows, request({ page: 1, pageSize: 2 })).list.map((r) => r.runId)).toEqual([
      1,
    ]);
    expect(toRunPage(rows, request({ page: 5, pageSize: 2 })).list).toEqual([]);
  });

  it('숫자 컬럼 오름차순·내림차순', () => {
    const asc = toRunPage(
      rows,
      request({ orderBy: [{ column: 'rowsUpserted', direction: 'ASCENDING' }] }),
    );
    expect(asc.list.map((r) => r.rowsUpserted)).toEqual([30, 100, 200]);
    const desc = toRunPage(
      rows,
      request({ orderBy: [{ column: 'rowsUpserted', direction: 'DESCENDING' }] }),
    );
    expect(desc.list.map((r) => r.rowsUpserted)).toEqual([200, 100, 30]);
  });

  it('ISO 문자열(날짜)은 사전순이 곧 시간순이다', () => {
    const asc = toRunPage(
      rows,
      request({ orderBy: [{ column: 'startedAt', direction: 'ASCENDING' }] }),
    );
    expect(asc.list.map((r) => r.runId)).toEqual([1, 2, 3]);
  });

  it('같은 값끼리는 원래 순서를 지킨다(안정 정렬)', () => {
    const page = toRunPage(
      rows,
      request({ orderBy: [{ column: 'status', direction: 'ASCENDING' }] }),
    );
    expect(page.list.map((r) => r.runId)).toEqual([2, 3, 1]);
  });

  it('입력 배열을 변형하지 않는다', () => {
    const copy = [...rows];
    toRunPage(rows, request({ orderBy: [{ column: 'runId', direction: 'ASCENDING' }] }));
    expect(rows).toEqual(copy);
  });
});
