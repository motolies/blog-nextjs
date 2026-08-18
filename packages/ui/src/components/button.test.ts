import { describe, expect, it } from 'vitest';
import { cn } from '../lib/cn';
import { badgeVariants } from './badge';
import { buttonVariants, iconButtonVariants } from './button';

/**
 * cva 조합 전수의 **글자색 생존** 검증.
 *
 * 문자열을 테스트에 복제하지 않고 cva 객체를 그대로 돌린다 — 복제하면 이중 관리가 되어
 * 정작 컴포넌트가 바뀔 때 테스트가 따라오지 않는다.
 *
 * 무수식 `text-dl-*` 가 **색 1 + 크기 1** 로 정확히 둘 남아야 한다. 색이 사라지면
 * body 상속색(검정)이 나오는데, 그것이 Primary 버튼 라벨이 검게 나온 실제 사고였다.
 */
const BUTTON_VARIANTS = [
  'primary',
  'outline-primary',
  'outline-strong',
  'outline-gray',
  'outline-red',
  // blog 추가 variant — 시각 무게 없는 보조 액션. hover 수렴 규칙의 의도적 예외(아래 참조).
  'ghost',
] as const;
const ICON_BUTTON_TONES = ['neutral', 'primary', 'danger', 'excel'] as const;
const BADGE_TONES = ['neutral', 'primary', 'success', 'warning', 'danger'] as const;
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

/** 수식(hover: 등) 없는 `text-dl-*` 만 — 평상시 상태가 검증 대상이다. */
function bareTextClasses(classes: string): string[] {
  return classes.split(' ').filter((c) => c.startsWith('text-dl-') && !c.includes(':'));
}

const FONT_SIZE_RE = /^text-dl-(ctl-)?(xs|sm|md|base|lg|xl|subtitle|title|heading)$/;

describe('Button — 글자색이 크기 토큰에 먹히지 않는다', () => {
  it.each(BUTTON_VARIANTS.flatMap((v) => SIZES.map((s) => [v, s] as const)))(
    '%s / %s',
    (variant, size) => {
      const bare = bareTextClasses(cn(buttonVariants({ variant, size })));
      expect(bare.filter((c) => FONT_SIZE_RE.test(c))).toHaveLength(1);
      expect(bare.filter((c) => !FONT_SIZE_RE.test(c))).toHaveLength(1);
    },
  );
});

describe('Badge — 글자색이 크기 토큰에 먹히지 않는다', () => {
  it.each(BADGE_TONES.flatMap((t) => SIZES.map((s) => [t, s] as const)))(
    '%s / %s',
    (tone, size) => {
      const bare = bareTextClasses(cn(badgeVariants({ tone, size })));
      expect(bare.filter((c) => FONT_SIZE_RE.test(c))).toHaveLength(1);
      expect(bare.filter((c) => !FONT_SIZE_RE.test(c))).toHaveLength(1);
    },
  );
});

/**
 * 삭제 버튼의 hover 가 base 의 primary 채움을 **덮는지.**
 *
 * cva 원문에는 base(primary)와 variant(danger)의 hover 가 **둘 다 남아 있다** — 실제
 * 화면에서 어느 쪽이 이기는지는 `cn()` 의 twMerge 가 정하므로 원문이 아니라 병합
 * 결과를 본다. 위의 "글자색이 크기 토큰에 먹힌" 사고와 같은 층위의 검증이다.
 *
 * 이탈은 **삭제 하나뿐**이라는 것까지 함께 고정한다 — 예외가 조용히 번지면 hover 수렴
 * 규칙 자체가 사라진다.
 */
function mergedClasses(classes: string): string[] {
  return cn(classes).split(' ');
}

describe('삭제 버튼 hover — brand 가 아니라 자기 색으로 채운다', () => {
  it('outline-red: danger 로 채우고 primary 채움은 남지 않는다', () => {
    const merged = mergedClasses(buttonVariants({ variant: 'outline-red' }));
    expect(merged).toContain('hover:bg-dl-danger-hover');
    expect(merged).toContain('hover:text-dl-danger-fg');
    expect(merged).toContain('hover:border-dl-danger-hover');
    expect(merged).toContain('active:bg-dl-danger-hover');
    expect(merged).not.toContain('hover:bg-dl-primary-hover');
    expect(merged).not.toContain('active:bg-dl-primary-active');
  });

  it('IconButton tone=danger: 같은 규칙이다', () => {
    const merged = mergedClasses(iconButtonVariants({ tone: 'danger' }));
    expect(merged).toContain('hover:bg-dl-danger-hover');
    expect(merged).toContain('hover:text-dl-danger-fg');
    expect(merged).not.toContain('hover:bg-dl-primary-hover');
  });

  it.each(BUTTON_VARIANTS.filter((v) => v !== 'outline-red' && v !== 'ghost'))(
    '%s: 이탈하지 않고 primary 채움으로 수렴한다',
    (variant) => {
      const merged = mergedClasses(buttonVariants({ variant }));
      expect(merged).toContain('hover:bg-dl-primary-hover');
      expect(merged).not.toContain('hover:bg-dl-danger-hover');
    },
  );

  // ghost 는 유일하게 hover 공통 규칙(primary 채움 수렴)을 따르지 않는다 —
  // 은은한 면(option-hover)만 깔린다. 이탈이 규칙이므로 여기 못 박는다.
  it('ghost: primary 로 수렴하지 않고 option-hover 만 깔린다', () => {
    const merged = mergedClasses(buttonVariants({ variant: 'ghost' }));
    expect(merged).toContain('hover:bg-dl-option-hover');
    expect(merged).not.toContain('hover:bg-dl-primary-hover');
    expect(merged).not.toContain('hover:bg-dl-danger-hover');
  });

  it.each(ICON_BUTTON_TONES.filter((t) => t !== 'danger'))(
    'IconButton %s: 이탈하지 않고 primary 채움으로 수렴한다',
    (tone) => {
      const merged = mergedClasses(iconButtonVariants({ tone }));
      expect(merged).toContain('hover:bg-dl-primary-hover');
      expect(merged).not.toContain('hover:bg-dl-danger-hover');
    },
  );
});
