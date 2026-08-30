import { describe, expect, it } from 'vitest';
import type { MasterCodeNode } from '@/types/masterCode';
import {
  buildNodeCode,
  DEFAULT_COLLAPSE_STATE,
  parseCollapseState,
  renumberSiblings,
  serializeCollapseState,
  toAdminLinkTree,
  toggleGroupCollapse,
  toLinkGroups,
} from './linkTree';

/** 백엔드 서브트리 응답 모양(루트 하나짜리 배열)을 만든다. */
function tree(groups: MasterCodeNode[]): MasterCodeNode[] {
  return [
    {
      id: '0000000000001',
      code: 'PLATFORM',
      name: '플랫폼',
      sort: 6,
      isActive: true,
      children: groups,
    },
  ];
}

describe('toLinkGroups', () => {
  it('3-depth 트리를 그룹/링크 2-depth 로 접는다', () => {
    const result = toLinkGroups(
      tree([
        {
          id: '0000000000002',
          code: 'DEPLOY',
          name: '배포',
          attributes: { icon: 'Rocket' },
          children: [
            {
              id: '0000000000003',
              code: 'ARGOCD',
              name: 'ArgoCD',
              attributes: { url: 'https://argo.test', icon: 'Ship' },
            },
          ],
        },
      ]),
    );

    expect(result).toEqual([
      {
        code: 'DEPLOY',
        name: '배포',
        icon: 'Rocket',
        links: [{ name: 'ArgoCD', url: 'https://argo.test', icon: 'Ship' }],
      },
    ]);
  });

  it('URL 이 없는 링크는 버린다 — 눌러도 아무 일 없는 죽은 카드를 만들지 않는다', () => {
    const result = toLinkGroups(
      tree([
        {
          id: '0000000000002',
          code: 'DEPLOY',
          name: '배포',
          children: [
            { id: '0000000000003', code: 'A', name: 'URL 없음' },
            {
              id: '0000000000004',
              code: 'B',
              name: '정상',
              attributes: { url: 'https://ok.test' },
            },
          ],
        },
      ]),
    );

    expect(result[0].links).toEqual([{ name: '정상', url: 'https://ok.test', icon: undefined }]);
  });

  it('아이콘이 비었으면 undefined 로 접는다 — 호출부가 아이콘 자리를 생략할 수 있어야 한다', () => {
    const result = toLinkGroups(
      tree([
        {
          id: '0000000000002',
          code: 'G',
          name: '그룹',
          attributes: { icon: '' },
          children: [
            { id: '0000000000003', code: 'L', name: '링크', attributes: { url: 'https://a.test' } },
          ],
        },
      ]),
    );

    expect(result[0].icon).toBeUndefined();
    expect(result[0].links[0].icon).toBeUndefined();
  });

  it('빈 입력·자식 없는 루트·자식 없는 그룹을 모두 견딘다', () => {
    expect(toLinkGroups(undefined)).toEqual([]);
    expect(toLinkGroups(null)).toEqual([]);
    expect(toLinkGroups([])).toEqual([]);
    expect(toLinkGroups(tree([]))).toEqual([]);
    expect(toLinkGroups(tree([{ id: '0000000000002', code: 'G', name: '빈 그룹' }]))).toEqual([
      { code: 'G', name: '빈 그룹', icon: undefined, links: [] },
    ]);
  });
});

describe('toAdminLinkTree', () => {
  it('rootId 와 편집용 필드를 채운다', () => {
    const result = toAdminLinkTree(
      tree([
        {
          id: '0000000000002',
          code: 'DEPLOY',
          name: '배포',
          description: '배포 도구',
          sort: 1,
          isActive: true,
          attributes: { icon: 'Rocket' },
          children: [
            {
              id: '0000000000003',
              code: 'ARGOCD',
              name: 'ArgoCD',
              sort: 1,
              isActive: false,
              attributes: { url: 'https://argo.test', icon: 'Ship' },
            },
          ],
        },
      ]),
    );

    expect(result?.rootId).toBe('0000000000001');
    expect(result?.groups[0]).toMatchObject({
      id: '0000000000002',
      description: '배포 도구',
      icon: 'Rocket',
    });
    // 표시용과 달리 숨긴 링크도 남는다 — 관리 화면에서 다시 켤 수 있어야 한다.
    expect(result?.groups[0].links[0]).toMatchObject({ id: '0000000000003', isActive: false });
  });

  it('URL 이 없는 링크도 남긴다 — 관리 화면은 비어 있다는 사실을 보여줘야 한다', () => {
    const result = toAdminLinkTree(
      tree([
        {
          id: '0000000000002',
          code: 'G',
          name: '그룹',
          children: [{ id: '0000000000003', code: 'L', name: '링크' }],
        },
      ]),
    );

    expect(result?.groups[0].links).toHaveLength(1);
    expect(result?.groups[0].links[0].url).toBe('');
  });

  it('루트가 없으면 null', () => {
    expect(toAdminLinkTree([])).toBeNull();
    expect(toAdminLinkTree(undefined)).toBeNull();
  });
});

describe('parseCollapseState', () => {
  it('정상 왕복', () => {
    const state = { section: true, groups: ['DEPLOY', 'DATA'] };
    expect(parseCollapseState(serializeCollapseState(state))).toEqual(state);
  });

  it.each([
    ['null', null],
    ['빈 문자열', ''],
    ['깨진 JSON', '{sect'],
    ['객체가 아님(배열)', '[1,2]'],
    ['객체가 아님(숫자)', '42'],
    ['JSON null', 'null'],
  ])('%s 이면 기본값으로 돌아간다', (_label, raw) => {
    expect(parseCollapseState(raw)).toEqual(DEFAULT_COLLAPSE_STATE);
  });

  it('groups 가 배열이 아니면 빈 배열로 만든다', () => {
    expect(parseCollapseState('{"section":true,"groups":"DEPLOY"}')).toEqual({
      section: true,
      groups: [],
    });
  });

  it('문자열이 아닌 원소만 걸러내고 나머지는 살린다', () => {
    expect(parseCollapseState('{"section":false,"groups":["A",1,null,"B"]}')).toEqual({
      section: false,
      groups: ['A', 'B'],
    });
  });

  it('section 은 true 일 때만 true — 문자열 "true" 같은 값에 속지 않는다', () => {
    expect(parseCollapseState('{"section":"true","groups":[]}').section).toBe(false);
    expect(parseCollapseState('{"section":1,"groups":[]}').section).toBe(false);
  });
});

describe('toggleGroupCollapse', () => {
  it('접기와 펴기를 왕복한다', () => {
    const opened = { section: false, groups: [] };
    const closed = toggleGroupCollapse(opened, 'DEPLOY');
    expect(closed.groups).toEqual(['DEPLOY']);
    expect(toggleGroupCollapse(closed, 'DEPLOY').groups).toEqual([]);
  });

  it('section 상태는 건드리지 않는다', () => {
    expect(toggleGroupCollapse({ section: true, groups: [] }, 'A').section).toBe(true);
  });
});

describe('buildNodeCode', () => {
  it('이름을 대문자 코드로 만든다', () => {
    expect(buildNodeCode('GitHub Actions', [])).toBe('GITHUB_ACTIONS');
  });

  it('연속 특수문자를 하나로 줄이고 양끝을 다듬는다', () => {
    expect(buildNodeCode('  --Grafana / Loki--  ', [])).toBe('GRAFANA_LOKI');
  });

  it('영숫자가 남지 않는 한글 이름은 폴백 코드를 쓴다', () => {
    expect(buildNodeCode('배포', [])).toBe('LINK');
  });

  it('형제와 겹치면 접미사를 붙인다', () => {
    expect(buildNodeCode('배포', ['LINK'])).toBe('LINK_2');
    expect(buildNodeCode('배포', ['LINK', 'LINK_2'])).toBe('LINK_3');
  });

  it('64자를 넘지 않는다 — 접미사를 붙일 때도', () => {
    const long = 'A'.repeat(80);
    expect(buildNodeCode(long, [])).toHaveLength(64);
    const collided = buildNodeCode(long, ['A'.repeat(64)]);
    expect(collided).toHaveLength(64);
    expect(collided.endsWith('_2')).toBe(true);
  });
});

describe('renumberSiblings', () => {
  const rows = [
    { id: '0000000000010', sort: 1 },
    { id: '0000000000011', sort: 2 },
    { id: '0000000000012', sort: 3 },
  ];

  it('한 칸 위로 옮기면 두 노드만 바뀐다', () => {
    expect(renumberSiblings(rows, 2, 1)).toEqual([
      { id: '0000000000012', sort: 2 },
      { id: '0000000000011', sort: 3 },
    ]);
  });

  it('sort 에 구멍이 있으면 이동하면서 1..n 으로 함께 고친다', () => {
    const holed = [
      { id: '0000000000010', sort: 5 },
      { id: '0000000000011', sort: 9 },
    ];
    expect(renumberSiblings(holed, 0, 1)).toEqual([
      { id: '0000000000011', sort: 1 },
      { id: '0000000000010', sort: 2 },
    ]);
  });

  it('sort 가 전부 동률이어도 정규화된다 — swap 방식이라면 무동작이 될 경우다', () => {
    const tied = [
      { id: '0000000000010', sort: 0 },
      { id: '0000000000011', sort: 0 },
    ];
    expect(renumberSiblings(tied, 1, 0)).toEqual([
      { id: '0000000000011', sort: 1 },
      { id: '0000000000010', sort: 2 },
    ]);
  });

  it('제자리 이동이나 범위 밖 인덱스는 빈 배열', () => {
    expect(renumberSiblings(rows, 1, 1)).toEqual([]);
    expect(renumberSiblings(rows, -1, 0)).toEqual([]);
    expect(renumberSiblings(rows, 0, 3)).toEqual([]);
    expect(renumberSiblings([], 0, 0)).toEqual([]);
  });

  it('원본 배열을 변형하지 않는다', () => {
    const original = [...rows];
    renumberSiblings(rows, 0, 2);
    expect(rows).toEqual(original);
  });
});
