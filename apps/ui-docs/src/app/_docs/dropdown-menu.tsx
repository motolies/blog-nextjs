import type { DropdownMenuItem } from '@hvy/ui';
import { Menu } from 'lucide-react';
import type { ComponentProps } from 'react';
import { DropdownMenuBasicDemo } from '../../client/ui-test/docs/demos/dropdown-menu/basic';
import { DropdownMenuSingleItemDemo } from '../../client/ui-test/docs/demos/dropdown-menu/single-item';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger } from '@hvy/ui';

<DropdownMenu>
  <DropdownMenuTrigger>
    <IconButton icon={Menu} label="더 보기" />
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={printInvoice}>송장 출력</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem destructive onSelect={remove}>삭제</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`;

/** DropdownMenu 문서 — 행 액션·오버플로 메뉴용 범용 컨트롤. */
export const dropdownMenuDoc: DocEntry = {
  slug: 'dropdown-menu',
  category: 'components',
  title: 'DropdownMenu',
  description:
    '그리드 행 액션·툴바 오버플로 메뉴용 범용 드롭다운 — radix DropdownMenu 를 토큰으로 입혔다. roving focus·화살표 이동·typeahead·Esc/외부 클릭 닫기가 radix 몫이고 이 계층이 "틀리면 조용히 위험한" 부분이라 Primitive 로 중앙 관리한다(워크탭 컨텍스트 메뉴가 내부에서 이미 같은 것을 쓴다). 트리거는 기존 버튼 규격(Button·IconButton)에 병합된다(asChild 고정) — 새 버튼 모양을 만들면 버튼 체계가 둘이 된다. 내비게이션이 아니다 — 메뉴 이동 링크는 사이드바 하나뿐(루트 규칙)이므로 아이템은 행동(onSelect)만 갖는다. 아이템이 정확히 하나면 패널을 열지 않고 트리거 클릭이 곧 실행이다 — 고를 것이 없는 팝업은 클릭만 늘린다(아이템 0개·2개 이상, 또는 DropdownMenuLabel 이 있으면 접지 않는다).',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '기본 — 행 액션 · 오버플로 메뉴',
      note: '화살표로 아이템을 이동하고 글자를 치면 typeahead 로 점프한다(radix). destructive 아이템은 빨간 글자로 위험 신호를 유지하고 Separator 로 가른다. 아이콘은 메뉴 단위로 통일한다 — 일부만 있으면 정렬이 어긋난다.',
      file: 'src/client/ui-test/docs/demos/dropdown-menu/basic.tsx',
      Component: DropdownMenuBasicDemo,
    },
    {
      id: 'single-item',
      title: '아이템이 하나 — 팝업 없이 즉시 발화',
      note: '고를 것이 하나뿐이면 패널을 열지 않고 트리거 클릭이 곧 실행이다 — 클릭 두 번이 한 번이 된다. 아이템 수는 런타임에 오가므로(권한 필터·조건 소진) 토글로 그 순간을 재현했다: 트리거 버튼은 리마운트되지 않아 포커스가 유지되고, 메뉴를 연 상태에서 하나로 줄여도 열린 패널이 사라지지 않는다. 하나뿐인 아이템이 disabled 면 트리거가 잠긴다 — 왜 못 누르는지는 앱이 title 로 적는다(ui 는 사전을 모른다).',
      file: 'src/client/ui-test/docs/demos/dropdown-menu/single-item.tsx',
      Component: DropdownMenuSingleItemDemo,
    },
  ],
  propsTables: [
    {
      title: 'DropdownMenuItem',
      rows: definePropRows<ComponentProps<typeof DropdownMenuItem>>()([
        {
          name: 'onSelect',
          type: '() => void',
          description: '아이템 실행 — 실행 후 메뉴는 radix 가 닫는다.',
        },
        {
          name: 'icon',
          type: 'IconName',
          description: '라벨 왼쪽 아이콘 — 메뉴 단위로 통일한다(일부만 있으면 정렬이 어긋난다).',
        },
        {
          name: 'destructive',
          type: 'boolean',
          description: '파괴적 액션 — 빨간 글자 + 빨간 틴트 하이라이트로 위험 신호를 유지한다.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: '비활성 아이템 — 목록에서 빼지 않고 회색으로 남긴다.',
        },
      ]),
    },
    {
      title: 'DropdownMenuContent',
      rows: [
        {
          name: 'align',
          type: "'start' | 'center' | 'end'",
          defaultValue: "'start'",
          description: '트리거 기준 정렬 — 우측 끝 오버플로 버튼이면 end.',
        },
        {
          name: 'sideOffset',
          type: 'number',
          defaultValue: '4',
          description: '트리거와의 간격(px).',
        },
      ],
    },
  ],
};
