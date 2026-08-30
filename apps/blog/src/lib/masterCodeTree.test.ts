import { describe, expect, it } from 'vitest';
import { replaceChildren } from './masterCodeTree';

type Node = { id: string; children?: Node[] };

const tree: Node[] = [
  {
    id: 'root',
    children: [
      { id: 'a', children: [{ id: 'a1' }, { id: 'a2' }] },
      { id: 'b' },
    ],
  },
];

describe('replaceChildren', () => {
  it('지정한 부모의 자식 목록만 교체한다', () => {
    const next = replaceChildren(tree, 'a', [{ id: 'a2' }, { id: 'a1' }]);

    expect(next[0]?.children?.[0]?.children?.map((n) => n.id)).toEqual(['a2', 'a1']);
    // 형제는 그대로다.
    expect(next[0]?.children?.[1]?.id).toBe('b');
  });

  it('루트의 자식 목록도 교체할 수 있다', () => {
    const next = replaceChildren(tree, 'root', [{ id: 'b' }, { id: 'a' }]);
    expect(next[0]?.children?.map((n) => n.id)).toEqual(['b', 'a']);
  });

  it('원본 트리를 변형하지 않는다', () => {
    const before = JSON.stringify(tree);
    replaceChildren(tree, 'a', [{ id: 'a2' }, { id: 'a1' }]);
    expect(JSON.stringify(tree)).toBe(before);
  });

  it('바뀌지 않은 가지는 참조를 유지한다 — React 가 다시 그리지 않도록', () => {
    const next = replaceChildren(tree, 'a', [{ id: 'a2' }, { id: 'a1' }]);
    // 형제 b 는 같은 객체여야 한다.
    expect(next[0]?.children?.[1]).toBe(tree[0]?.children?.[1]);
  });

  it('부모를 못 찾으면 원본 배열을 그대로 돌려준다', () => {
    expect(replaceChildren(tree, 'nope', [{ id: 'x' }])).toBe(tree);
  });

  it('빈 트리에서도 안전하다', () => {
    expect(replaceChildren([], 'a', [{ id: 'x' }])).toEqual([]);
  });
});
