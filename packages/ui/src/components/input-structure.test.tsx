import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Input, Textarea } from './input';

/**
 * **입력 DOM 이 살아남는가** — 조건부 래핑 회귀 방어.
 *
 * 검사 대상은 루트 태그가 아니라 **입력 노드까지의 조상 경로**다. 바깥 래퍼를 고정해도
 * 안쪽 래퍼가 조건부면 똑같이 깨지는데, 루트만 보면 그걸 놓친다(실제로 놓쳤다).
 *
 * 실측 버그: `clearable` 의 × 는 값이 있을 때만 뜨는데, 어도먼트가 있을 때만 `<span>` 으로
 * 감싸던 시절에는 **빈 칸에 첫 글자를 치는 순간** 반환 트리가 `<input>` → `<span><input></span>`
 * 으로 바뀌었다. React 는 위치가 달라진 노드를 재사용하지 않고 파괴하므로 포커스가 날아가고
 * 첫 글자만 남았다(IME 조합 중이면 더 확실히 깨진다).
 *
 * DOM 이 없는 node 환경이라 포커스는 직접 검사할 수 없다. 대신 **루트 엘리먼트 타입이
 * 상태에 따라 달라지지 않는다**는 불변식을 마크업으로 고정한다 — 그게 이 버그의 원인이었다.
 */

/**
 * 입력 노드까지의 **조상 경로**. 루트 태그만 보면 부족하다 —
 * 바깥 래퍼가 그대로여도 안쪽 래퍼가 조건부면 입력의 부모가 달라져 똑같이 파괴된다.
 * React 의 재조정은 "같은 자리의 같은 타입"을 보므로, 이 경로가 불변식이다.
 */
function pathToControl(markup: string, tag: 'input' | 'textarea'): string {
  const head = markup.slice(0, markup.indexOf(`<${tag}`));
  return (head.match(/<[a-z]+/g) ?? []).join(' > ');
}

describe('Input — 상태가 바뀌어도 입력 노드의 자리가 같다', () => {
  it('clearable: 값이 비었다 ↔ 찼다 에서 입력의 자리가 바뀌지 않는다', () => {
    const empty = renderToStaticMarkup(<Input clearable value="" onChange={() => {}} />);
    const filled = renderToStaticMarkup(<Input clearable value="a" onChange={() => {}} />);

    // 값이 찼을 때만 × 가 뜨지만, 그 차이가 루트 태그를 바꿔서는 안 된다.
    expect(filled).toContain('button');
    expect(empty).not.toContain('button');
    expect(pathToControl(empty, 'input')).toBe(pathToControl(filled, 'input'));
  });

  it('어도먼트가 하나도 없어도 같은 래퍼를 거친다', () => {
    const bare = renderToStaticMarkup(<Input value="a" onChange={() => {}} />);
    const withSuffix = renderToStaticMarkup(<Input suffix="회" value="a" onChange={() => {}} />);
    expect(pathToControl(bare, 'input')).toBe(pathToControl(withSuffix, 'input'));
  });

  it('showCount 를 켜고 꺼도 입력의 자리가 바뀌지 않는다', () => {
    const off = renderToStaticMarkup(<Input maxLength={10} value="ab" onChange={() => {}} />);
    const on = renderToStaticMarkup(
      <Input showCount maxLength={10} value="ab" onChange={() => {}} />,
    );
    expect(on).toContain('2/10');
    expect(off).not.toContain('2/10');
    expect(pathToControl(off, 'input')).toBe(pathToControl(on, 'input'));
  });
});

describe('Textarea — 상태가 바뀌어도 입력 노드의 자리가 같다', () => {
  it('lock 을 켜고 꺼도 입력의 자리가 바뀌지 않는다', () => {
    const unlocked = renderToStaticMarkup(<Textarea value="a" onChange={() => {}} />);
    const locked = renderToStaticMarkup(<Textarea lock value="a" onChange={() => {}} />);
    expect(pathToControl(unlocked, 'textarea')).toBe(pathToControl(locked, 'textarea'));
  });

  it('showCount 를 켜고 꺼도 입력의 자리가 바뀌지 않는다', () => {
    const off = renderToStaticMarkup(<Textarea maxLength={10} value="ab" onChange={() => {}} />);
    const on = renderToStaticMarkup(
      <Textarea showCount maxLength={10} value="ab" onChange={() => {}} />,
    );
    expect(on).toContain('2/10');
    expect(pathToControl(off, 'textarea')).toBe(pathToControl(on, 'textarea'));
  });
});
