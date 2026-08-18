import { describe, expect, it } from 'vitest';
import { cn, DL_FONT_SIZE_TOKENS } from './cn';

/**
 * `cn()` 의 클래스 병합 계약.
 *
 * 이 파일이 존재하는 이유는 실제 사고다 — twMerge 가 `text-dl-primary-fg`(색)를
 * `text-dl-ctl-md`(크기)와 같은 그룹으로 보고 **글자색을 통째로 지웠고**, 그 결과
 * Primary 버튼 라벨이 body 상속색(검정)으로 렌더됐다. 화면 말고는 아무것도 잡지 못했다.
 * 아래 케이스가 그 조합을 고정한다.
 */
describe('cn — text-dl-* 색/크기 분리', () => {
  it('색과 크기가 서로를 지우지 않는다 (양방향)', () => {
    expect(cn('text-dl-primary-fg', 'text-dl-ctl-md')).toBe('text-dl-primary-fg text-dl-ctl-md');
    expect(cn('text-dl-ctl-md', 'text-dl-primary-fg')).toBe('text-dl-ctl-md text-dl-primary-fg');
  });

  // 안 지우는 것과 **못 지우는 것**은 다르다 — 병합 자체는 살아 있어야 호출부가 덮어쓸 수 있다.
  it('같은 축끼리는 뒤가 이긴다', () => {
    expect(cn('text-dl-ctl-sm', 'text-dl-ctl-md')).toBe('text-dl-ctl-md');
    expect(cn('text-dl-xs', 'text-dl-heading')).toBe('text-dl-heading');
    expect(cn('text-dl-fg', 'text-dl-primary')).toBe('text-dl-primary');
  });

  // 목록 누락이 곧 색 소실이므로 선언된 크기 토큰 전수를 돈다.
  it.each([...DL_FONT_SIZE_TOKENS])('%s 는 글자색을 지우지 않는다', (token) => {
    expect(cn('text-dl-fg', `text-${token}`)).toBe(`text-dl-fg text-${token}`);
  });

  it('modifier 스코프는 무수식과 독립이다', () => {
    expect(cn('hover:text-dl-primary-fg', 'text-dl-ctl-md')).toBe(
      'hover:text-dl-primary-fg text-dl-ctl-md',
    );
    expect(cn('text-dl-fg', 'hover:text-dl-primary-fg')).toBe(
      'text-dl-fg hover:text-dl-primary-fg',
    );
  });

  it('임의값이 토큰을 덮는다 — 호출부 탈출구', () => {
    expect(cn('text-dl-ctl-md', 'text-[13px]')).toBe('text-[13px]');
  });
});

describe('cn — 치수·radius 병합', () => {
  // 구 `classGroups.size` 땜질은 size- 접두사 하나만 다뤘다. 나머지는 둘 다 남아
  // 호출부 className 오버라이드가 조용히 안 먹었다.
  it('같은 축의 치수 유틸리티는 뒤가 이긴다', () => {
    expect(cn('h-dl-control', 'h-dl-control-sm')).toBe('h-dl-control-sm');
    expect(cn('px-dl-btn-pad-md', 'px-dl-btn-pad-lg')).toBe('px-dl-btn-pad-lg');
    expect(cn('rounded-dl-container', 'rounded-dl-badge')).toBe('rounded-dl-badge');
    expect(cn('size-dl-ic-sm', 'size-dl-ctl-ic-md')).toBe('size-dl-ctl-ic-md');
  });

  it('축이 다르면 함께 남는다', () => {
    expect(cn('h-dl-control', 'px-dl-btn-pad-md')).toBe('h-dl-control px-dl-btn-pad-md');
    expect(cn('bg-dl-primary', 'text-dl-primary-fg', 'border-dl-primary')).toBe(
      'bg-dl-primary text-dl-primary-fg border-dl-primary',
    );
  });
});

describe('cn — 알려진 과잉 (tailwind-merge 기본 동작)', () => {
  // font-size 그룹이 앞선 leading-* 를 지운다. 우리 --text-dl-* 에는 짝 line-height 가
  // 없어 실제로는 과잉이지만, stock text-sm 의 정상 동작까지 깨지므로 끄지 않고 고정한다.
  it('font-size 는 앞선 leading-* 를 지운다', () => {
    expect(cn('leading-relaxed', 'text-dl-xs')).toBe('text-dl-xs');
    expect(cn('text-dl-xs', 'leading-relaxed')).toBe('text-dl-xs leading-relaxed');
  });
});
