import type { StatTileProps } from '@hvy/ui';
import { StatTilePlaygroundDemo } from '../../client/ui-test/docs/demos/stat-tile/playground';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { StatTile } from '@hvy/ui';

<StatTile label="이슈" hint="전체 기준" tone="danger" value="4"
  active={params.status === 'issue'} onClick={() => setFilters({ status: 'issue' })} />`;

/** StatTile 문서 — 표시 전용과 필터 숏컷 두 얼굴. */
export const statTileDoc: DocEntry = {
  slug: 'stat-tile',
  category: 'components',
  title: 'StatTile',
  description:
    '요약 스탯 타일 — onClick 이 없으면 표시 전용(div), 있으면 필터 숏컷(button + aria-pressed). 수치는 반드시 화면의 그리드와 같은 데이터에서 파생시키고, 집계 기준이 화면 필터와 다르면 hint 에 기준을 명기한다.',
  usage: USAGE,
  examples: [
    {
      id: 'playground',
      title: 'StatTile',
      note: '표시 전용 행 + 필터 숏컷 행. 실제 앱에서 active 판정의 진실은 URL 검색조건이다.',
      file: 'src/client/ui-test/docs/demos/stat-tile/playground.tsx',
      Component: StatTilePlaygroundDemo,
    },
  ],
  propsTables: [
    {
      title: 'StatTile',
      rows: definePropRows<StatTileProps>()([
        { name: 'label', type: 'ReactNode', required: true, description: '수치의 이름.' },
        { name: 'value', type: 'ReactNode', required: true, description: '수치 본문.' },
        {
          name: 'hint',
          type: 'ReactNode',
          description: '집계 기준 안내 — 라벨 뒤에 「· hint」로 붙는다.',
        },
        {
          name: 'tone',
          type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger'",
          defaultValue: "'neutral'",
          description: '수치 색 — 데이터의 뜻(이슈=danger 등)일 때만 쓴다.',
        },
        {
          name: 'active',
          type: 'boolean',
          defaultValue: 'false',
          description:
            '필터 숏컷 활성 여부 — 판정은 호출부(URL)가 한다. onClick 이 있을 때만 의미.',
        },
        {
          name: 'onClick',
          type: '() => void',
          description: '있으면 button 으로 렌더된다(필터 숏컷). 없으면 표시 전용 div.',
        },
      ]),
    },
  ],
};
