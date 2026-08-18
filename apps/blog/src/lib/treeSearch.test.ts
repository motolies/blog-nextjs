import { describe, expect, it } from 'vitest';
import { filterTree, splitByMatch } from './treeSearch';

interface Node {
  id: string;
  code: string;
  name: string;
  children?: Node[];
}

const getId = (node: Node) => node.id;
const getFields = (node: Node) => [node.code, node.name];

/** 마스터코드 트리를 본뜬 픽스처 — 루트가 코드 그룹, 자식이 개별 코드다. */
const tree: Node[] = [
  {
    id: '1',
    code: 'HOT_DEAL',
    name: '핫딜',
    children: [
      { id: '11', code: 'DEAL_SITE', name: '수집 사이트' },
      { id: '12', code: 'STATUS', name: '상태' },
    ],
  },
  {
    id: '2',
    code: 'SYSTEM',
    name: '시스템',
    children: [
      { id: '21', code: 'SYS_LOG', name: '로그' },
      {
        id: '22',
        code: 'SYS_CONFIG',
        name: '설정',
        children: [{ id: '221', code: 'DEAL_LIMIT', name: '딜 임계값' }],
      },
    ],
  },
];

describe('filterTree', () => {
  it('검색어가 비면 원본 배열을 그대로 돌려준다', () => {
    const result = filterTree(tree, '   ', getId, getFields);
    expect(result.nodes).toBe(tree);
    expect(result.matchCount).toBe(0);
    expect(result.matchedIds.size).toBe(0);
  });

  it('매칭 노드의 비매칭 자손은 버린다', () => {
    const result = filterTree(tree, 'HOT_DEAL', getId, getFields);

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('1');
    // DEAL_SITE·STATUS 는 검색어와 무관하다. 부모가 걸렸다고 딸려오지 않는다 —
    // 보이는 행은 전부 "결과이거나 결과로 가는 경로" 여야 건수와 화면이 어긋나지 않는다.
    expect(result.nodes[0].children).toEqual([]);
    expect(result.matchCount).toBe(1);
  });

  it('자식이 하나도 걸러지지 않으면 원본 참조를 그대로 재사용한다', () => {
    const intact: Node[] = [
      {
        id: 'a',
        code: 'A_DEAL',
        name: '가',
        children: [{ id: 'a1', code: 'A_DEAL_X', name: '나' }],
      },
    ];
    const result = filterTree(intact, 'deal', getId, getFields);
    expect(result.nodes[0]).toBe(intact[0]);
  });

  it('자손이 걸러지면 클론이 조상까지 전파된다', () => {
    // SYS 는 SYSTEM·SYS_LOG·SYS_CONFIG 에 걸리지만 손자 DEAL_LIMIT 은 아니다.
    // SYS_CONFIG 가 자식을 잃어 클론이 되면 그 부모도 새 객체가 된다.
    const result = filterTree(tree, 'SYS', getId, getFields);
    const system = result.nodes.find((n) => n.id === '2');
    expect(system).not.toBe(tree[1]);
    expect(system?.children?.map((c) => c.id)).toEqual(['21', '22']);
    expect(system?.children?.[1].children).toEqual([]);
  });

  it('자손이 매칭이면 조상을 경로로 남기고 비매칭 형제는 제거한다', () => {
    const result = filterTree(tree, 'DEAL_LIMIT', getId, getFields);

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('2');
    // SYS_LOG(21) 는 매칭도 경로도 아니므로 사라진다.
    expect(result.nodes[0].children?.map((c) => c.id)).toEqual(['22']);
    expect(result.nodes[0].children?.[0].children?.map((c) => c.id)).toEqual(['221']);
    // 경로로만 남은 조상은 자식이 걸러졌으므로 새 객체다.
    expect(result.nodes[0]).not.toBe(tree[1]);
    expect(result.matchCount).toBe(1);
    expect(result.matchedIds.has('221')).toBe(true);
    expect(result.matchedIds.has('2')).toBe(false);
  });

  it('여러 갈래에 걸친 매칭을 모두 찾는다', () => {
    const result = filterTree(tree, 'deal', getId, getFields);

    expect(result.nodes.map((n) => n.id)).toEqual(['1', '2']);
    // HOT_DEAL · DEAL_SITE · DEAL_LIMIT 셋. STATUS 는 매칭이 아니라 사라진다.
    expect(result.matchCount).toBe(3);
    expect([...result.matchedIds].sort()).toEqual(['1', '11', '221']);
    expect(result.nodes[0].children?.map((c) => c.id)).toEqual(['11']);
  });

  it('대소문자를 무시하고 코드·이름 어느 쪽이 맞아도 매칭한다', () => {
    expect(filterTree(tree, 'hot_deal', getId, getFields).matchCount).toBe(1);
    expect(filterTree(tree, '핫딜', getId, getFields).matchCount).toBe(1);
  });

  it('visibleIds 에 매칭 노드와 경로 조상을 담는다', () => {
    const result = filterTree(tree, 'DEAL_LIMIT', getId, getFields);
    expect([...result.visibleIds].sort()).toEqual(['2', '22', '221']);
  });

  it('매칭이 없으면 빈 트리를 돌려준다', () => {
    const result = filterTree(tree, '없는코드', getId, getFields);
    expect(result.nodes).toEqual([]);
    expect(result.matchCount).toBe(0);
  });
});

describe('splitByMatch', () => {
  it('매칭이 없으면 통짜 한 구간이다', () => {
    expect(splitByMatch('SYSTEM', 'deal')).toEqual([{ text: 'SYSTEM', matched: false }]);
  });

  it('검색어가 비면 쪼개지 않는다', () => {
    expect(splitByMatch('SYSTEM', '  ')).toEqual([{ text: 'SYSTEM', matched: false }]);
  });

  it('중간 매칭을 앞·매칭·뒤 세 구간으로 쪼갠다', () => {
    expect(splitByMatch('HOT_DEAL_X', 'deal')).toEqual([
      { text: 'HOT_', matched: false },
      { text: 'DEAL', matched: true },
      { text: '_X', matched: false },
    ]);
  });

  it('맨 앞 매칭 앞에 빈 구간을 만들지 않는다', () => {
    expect(splitByMatch('DEAL_SITE', 'deal')).toEqual([
      { text: 'DEAL', matched: true },
      { text: '_SITE', matched: false },
    ]);
  });

  it('여러 번 등장하면 모두 쪼갠다', () => {
    expect(splitByMatch('DEAL_TO_DEAL', 'deal')).toEqual([
      { text: 'DEAL', matched: true },
      { text: '_TO_', matched: false },
      { text: 'DEAL', matched: true },
    ]);
  });

  it('대소문자를 무시하되 원문 표기를 보존한다', () => {
    expect(splitByMatch('HotDeal', 'DEAL')).toEqual([
      { text: 'Hot', matched: false },
      { text: 'Deal', matched: true },
    ]);
  });

  it('소문자화로 길이가 변하는 문자가 섞이면 강조를 포기한다', () => {
    // 'İ'.toLowerCase() 는 2글자다 — 오프셋이 밀려 엉뚱한 구간이 칠해지느니 원문을 그대로 둔다.
    expect(splitByMatch('İstanbul', 'stan')).toEqual([{ text: 'İstanbul', matched: false }]);
  });

  it('정규식 메타문자를 글자 그대로 매칭한다', () => {
    expect(splitByMatch('a.*b', '.*')).toEqual([
      { text: 'a', matched: false },
      { text: '.*', matched: true },
      { text: 'b', matched: false },
    ]);
  });
});
