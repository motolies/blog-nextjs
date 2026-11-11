import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  MERMAID_DARK_TOKENS,
  MERMAID_EXPORT_BACKGROUND,
  mermaidThemeOptions,
  toMermaidTheme,
} from './mermaidTheme';

const THEME_DIR = fileURLToPath(new URL('../../../../packages/ui/src/theme/', import.meta.url));

/** 테마 CSS 에서 `--dl-<이름>: <hex>` 선언을 이름 → 값으로 읽는다. */
function readThemeTokens(fileName: string): Map<string, string> {
  const css = readFileSync(`${THEME_DIR}${fileName}`, 'utf8');
  const tokens = new Map<string, string>();
  for (const [, name, value] of css.matchAll(/--dl-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens.set(name, value.toLowerCase());
  }
  return tokens;
}

describe('MERMAID_DARK_TOKENS', () => {
  const darkTokens = readThemeTokens('blog-dark.css');

  it.each(Object.entries(MERMAID_DARK_TOKENS))(
    '%s 는 blog-dark.css 토큰 값과 같다',
    (name, value) => {
      expect(darkTokens.get(name)).toBe(value);
    },
  );
});

describe('MERMAID_EXPORT_BACKGROUND', () => {
  it('라이트 배경은 blog.css 의 표면색(gray-000)이다', () => {
    expect(MERMAID_EXPORT_BACKGROUND.default).toBe(readThemeTokens('blog.css').get('gray-000'));
  });

  it('다크 배경은 blog-dark.css 의 표면색(gray-000)이다', () => {
    expect(MERMAID_EXPORT_BACKGROUND.dark).toBe(readThemeTokens('blog-dark.css').get('gray-000'));
  });
});

describe('mermaidThemeOptions', () => {
  it('라이트는 내장 default 색을 그대로 두고 선 두께만 올린다', () => {
    const options = mermaidThemeOptions('default');
    expect(options.theme).toBe('default');
    expect(options.themeVariables).toEqual({ strokeWidth: 2 });
  });

  it('다크는 base 위에 팔레트를 쌓고 배경을 내보내기 배경과 맞춘다', () => {
    const options = mermaidThemeOptions('dark');
    expect(options.theme).toBe('base');
    expect(options.themeVariables.darkMode).toBe(true);
    expect(options.themeVariables.strokeWidth).toBe(2);
    expect(options.themeVariables.background).toBe(MERMAID_EXPORT_BACKGROUND.dark);
  });

  it('다크는 섹션 색 12칸을 모두 채운다 — 비면 base 가 검정으로 계산한다', () => {
    const { themeVariables } = mermaidThemeOptions('dark');
    for (let index = 0; index < 12; index += 1) {
      expect(themeVariables[`cScale${index}`]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it.each(['default', 'dark'] as const)(
    '%s 의 themeCSS 는 고정 두께 보충 규칙을 담고 색을 테마 배경에서 가져온다',
    (theme) => {
      const { themeCSS } = mermaidThemeOptions(theme);
      expect(themeCSS).toContain('.messageLine0, .messageLine1 { stroke-width: 2px; }');
      expect(themeCSS).toContain('.relationshipLine { stroke-width: 1.5px; }');
      expect(themeCSS).toContain(`circle { fill: ${MERMAID_EXPORT_BACKGROUND[theme]}; }`);
      expect(themeCSS).not.toContain('undefined');
    },
  );
});

describe('toMermaidTheme', () => {
  it('dark 만 다크로, 나머지는 라이트로 옮긴다', () => {
    expect(toMermaidTheme('dark')).toBe('dark');
    expect(toMermaidTheme('light')).toBe('default');
    expect(toMermaidTheme('system')).toBe('default');
    expect(toMermaidTheme(undefined)).toBe('default');
  });
});
