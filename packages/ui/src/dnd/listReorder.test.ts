import { describe, expect, it } from 'vitest';
import {
  clampOffset,
  clampToGroup,
  findDropIndex,
  groupRange,
  moveItem,
  shiftFor,
} from './listReorder';

const LIST = ['a', 'b', 'c', 'd'] as const;

describe('moveItem', () => {
  it('아래로 옮긴다', () => {
    expect(moveItem(LIST, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('위로 옮긴다', () => {
    expect(moveItem(LIST, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('제자리면 원본을 그대로 돌려준다 — 불필요한 리렌더를 만들지 않는다', () => {
    expect(moveItem(LIST, 2, 2)).toBe(LIST);
  });

  it('범위 밖 목표는 양 끝으로 가둔다', () => {
    expect(moveItem(LIST, 0, 99)).toEqual(['b', 'c', 'd', 'a']);
    expect(moveItem(LIST, 3, -5)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('원본을 변형하지 않는다', () => {
    const source = [...LIST];
    moveItem(source, 0, 3);
    expect(source).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('clampToGroup', () => {
  // 고정열 2개(true) + 일반열 3개(false)
  const groups = [true, true, false, false, false];

  it('고정열은 고정열 구간 밖으로 못 나간다', () => {
    expect(clampToGroup(groups, 0, 4)).toBe(1);
    expect(clampToGroup(groups, 1, 3)).toBe(1);
  });

  it('일반열은 고정열 위로 못 올라간다', () => {
    expect(clampToGroup(groups, 4, 0)).toBe(2);
    expect(clampToGroup(groups, 2, -3)).toBe(2);
  });

  it('그룹 안에서는 자유롭게 움직인다', () => {
    expect(clampToGroup(groups, 2, 4)).toBe(4);
    expect(clampToGroup(groups, 4, 2)).toBe(2);
    expect(clampToGroup(groups, 0, 1)).toBe(1);
  });

  it('고정열이 없으면 전체가 한 그룹이다', () => {
    expect(clampToGroup([false, false, false], 0, 2)).toBe(2);
  });
});

describe('groupRange', () => {
  const groups = [true, true, false, false, false];

  it('고정열 구간을 돌려준다', () => {
    expect(groupRange(groups, 0)).toEqual([0, 1]);
    expect(groupRange(groups, 1)).toEqual([0, 1]);
  });

  it('일반열 구간을 돌려준다', () => {
    expect(groupRange(groups, 2)).toEqual([2, 4]);
    expect(groupRange(groups, 4)).toEqual([2, 4]);
  });

  it('그룹이 하나면 전체가 한 구간이다', () => {
    expect(groupRange([false, false, false], 1)).toEqual([0, 2]);
  });
});

describe('clampOffset', () => {
  // 높이 30px 항목 5개. 앞 2개가 고정열.
  const centers = [15, 45, 75, 105, 135];
  const groups = [true, true, false, false, false];

  it('아래로 너무 많이 끌면 그룹 마지막 슬롯에서 멈춘다', () => {
    // index 2(일반열 첫 칸)에서 아래로 999 → 마지막 슬롯(135)까지 = 60
    expect(clampOffset(centers, groups, 2, 999)).toBe(60);
  });

  it('위로 너무 많이 끌면 그룹 첫 슬롯에서 멈춘다', () => {
    // index 4 에서 위로 -999 → 일반열 첫 칸(75)까지 = -60
    expect(clampOffset(centers, groups, 4, -999)).toBe(-60);
  });

  it('고정열은 고정 구간 안에서만 움직인다 — 일반열 쪽으로 못 내려간다', () => {
    expect(clampOffset(centers, groups, 0, 999)).toBe(30);
    expect(clampOffset(centers, groups, 1, 999)).toBe(0);
  });

  it('구간 안이면 그대로 통과시킨다', () => {
    expect(clampOffset(centers, groups, 2, 45)).toBe(45);
    expect(clampOffset(centers, groups, 3, -20)).toBe(-20);
  });
});

describe('shiftFor', () => {
  const H = 34;

  it('아래로 옮기면 지나온 구간이 위로 한 칸 당겨진다', () => {
    // 1 번을 4 번 자리로: 2·3·4 가 위로
    expect(shiftFor(2, 1, 4, H)).toBe(-H);
    expect(shiftFor(4, 1, 4, H)).toBe(-H);
  });

  it('위로 옮기면 지나온 구간이 아래로 밀린다', () => {
    // 4 번을 1 번 자리로: 1·2·3 이 아래로
    expect(shiftFor(1, 4, 1, H)).toBe(H);
    expect(shiftFor(3, 4, 1, H)).toBe(H);
  });

  it('잡은 항목 자신은 0 이다 — 그건 손을 따라 따로 움직인다', () => {
    expect(shiftFor(1, 1, 4, H)).toBe(0);
    expect(shiftFor(4, 4, 1, H)).toBe(0);
  });

  it('구간 밖은 움직이지 않는다', () => {
    expect(shiftFor(0, 1, 4, H)).toBe(0);
    expect(shiftFor(5, 1, 4, H)).toBe(0);
    expect(shiftFor(0, 4, 1, H)).toBe(0);
  });

  it('제자리면 아무도 안 움직인다', () => {
    expect(shiftFor(0, 2, 2, H)).toBe(0);
    expect(shiftFor(2, 2, 2, H)).toBe(0);
    expect(shiftFor(3, 2, 2, H)).toBe(0);
  });
});

describe('findDropIndex', () => {
  // 높이 30px 항목 4개의 중앙 좌표
  const centers = [15, 45, 75, 105];

  it('가장 가까운 슬롯을 고른다', () => {
    expect(findDropIndex(centers, 44)).toBe(1);
    expect(findDropIndex(centers, 61)).toBe(2);
  });

  it('목록 위/아래로 벗어나면 첫·끝 슬롯이 된다', () => {
    expect(findDropIndex(centers, -200)).toBe(0);
    expect(findDropIndex(centers, 9999)).toBe(3);
  });

  it('항목 높이가 달라도 실제 좌표로 판단한다', () => {
    // 두 번째 항목이 두 줄이라 키가 큰 경우
    expect(findDropIndex([15, 55, 105], 50)).toBe(1);
  });

  it('빈 목록은 0 이다', () => {
    expect(findDropIndex([], 100)).toBe(0);
  });
});
