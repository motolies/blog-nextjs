import type { ColumnSettingsDialog, ColumnSettingsLabels } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { ColumnSettingsBasicDemo } from '../../client/ui-test/docs/demos/column-settings/basic';
import { ColumnSettingsPinnedDemo } from '../../client/ui-test/docs/demos/column-settings/pinned';
import { ColumnSettingsPreferenceDemo } from '../../client/ui-test/docs/demos/column-settings/preference';
import { ColumnSettingsReorderDemo } from '../../client/ui-test/docs/demos/column-settings/reorder';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { ColumnSettingsDialog, applyColumnPreference, useGridPreference } from '@hvy/ui';

const preference = useGridPreference({ userKey, menuUrl, gridId: 'postList' });
// 그리드에는 적용본을, 모달에는 **원본**을 넘긴다 — 꺼 둔 컬럼도 목록에 있어야 다시 켠다.
const columns = applyColumnPreference(ALL_COLUMNS, preference.preference);

<DataGrid columns={columns} … />
<ColumnSettingsDialog
  open={open}
  onOpenChange={setOpen}
  columns={ALL_COLUMNS}            // 숨김 적용 **전** 원본
  preference={preference.preference}
  onApply={preference.setPreference}
  onReset={preference.reset}
  labels={LABELS}
/>`;

/** 제네릭 컴포넌트라 T 를 명시해 인스턴스화한다 — 추론만으로는 ComponentProps 가 열리지 않는다. */
type ColumnSettingsProps = ComponentProps<typeof ColumnSettingsDialog<Record<string, unknown>>>;

/** ColumnSettingsDialog 문서 — DataGrid 의 컬럼 표시·순서 설정 모달. */
export const columnSettingsDoc: DocEntry = {
  slug: 'column-settings',
  category: 'components',
  title: 'ColumnSettingsDialog',
  description:
    'DataGrid 의 컬럼 표시·순서 설정 모달 — 한 목록 + 체크박스 + 드래그 손잡이 구조다. 손잡이가 `<button>` 인 이유가 이 컴포넌트의 성격을 말한다: 드래그 전용으로 만들면 키보드 사용자가 순서를 바꿀 수 없는데, 이 모달은 "표를 읽을 수 있게 만드는" 도구라 그 사람들이야말로 가장 필요로 한다. draft 는 **열 때마다** 현재 설정에서 다시 만든다 — 편집 중 취소하고 다시 열었을 때 지난 편집이 남아 있으면 사용자는 그것이 이미 적용된 상태라고 읽는다. 고정열은 막는 게 아니라 **가둔다**(경계까지 따라오다 멈춘다). 모달에 넘기는 columns 는 **숨김 적용 전 원본**이어야 한다 — 여기가 어긋나면 한 번 끈 컬럼을 영영 못 켠다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '표시 토글 — draft 는 열 때마다 다시 만든다',
      note: '검증 포인트 — ① 체크를 끄고 「취소」한 뒤 다시 열면 꺼 두었던 체크가 남아 있지 않다: 열릴 때마다 현재 설정에서 draft 를 다시 만들기 때문이다. 남아 있으면 사용자는 그것이 이미 적용된 상태라고 읽는다 ② 「적용」을 눌러야 표에 반영된다(hidden·order 를 한 번에 넘긴다) ③ hideable:false 인 No·게시글 ID 는 체크가 잠기고 왜 못 누르는지 title 로 뜬다 ④ 이 모달은 폼이 아니다 — 「바깥 FormMode」를 view 로 바꿔도 안쪽 체크박스는 잠기지 않는다(내부에서 edit 로 핀되어 있고, Portal 이어도 React 트리를 따라 관통한다) ⑤ 원본 컬럼(숨김 적용 전)을 넘겨야 꺼 둔 컬럼도 목록에 보인다.',
      file: 'src/client/ui-test/docs/demos/column-settings/basic.tsx',
      Component: ColumnSettingsBasicDemo,
    },
    {
      id: 'reorder',
      title: '순서 변경 — 드래그와 ↑↓ 키가 같은 일을 한다',
      note: '검증 포인트 — ① ≡ 손잡이를 끌어 순서를 바꾼다: 드래그 중에는 배열이 바뀌지 않고 잡은 행만 손을 따라오며 나머지는 한 행 높이만큼 비켜난다 ② 손잡이에 Tab 으로 포커스를 준 뒤 ↑↓ 로도 같은 이동이 된다 ③ ↑ 를 연속으로 눌러 여러 칸 올라가는지 본다 — 배열이 바뀌면 DOM 이 새로 그려져 포커스가 body 로 떨어지므로 복원이 없으면 한 칸씩밖에 못 옮긴다 ④ 옮길 때마다 sr-only aria-live 안내가 나가고, 같은 문장이 연속되면 끝에 공백을 번갈아 붙여 다시 읽히게 한다 ⑤ 목록이 넘치면 가장자리에서 자동 스크롤이 걸리고 손을 떼면 반드시 멈춘다(안 멈추면 rAF 루프가 샌 것이다) — 컬럼을 9개로 둔 이유가 목록에 스크롤을 만들기 위해서다.',
      file: 'src/client/ui-test/docs/demos/column-settings/reorder.tsx',
      Component: ColumnSettingsReorderDemo,
    },
    {
      id: 'pinned',
      title: '고정열 — 막는 게 아니라 가둔다',
      note: '검증 포인트 — ① 고정열(No·게시글 ID)을 일반열 사이로 끌어도 고정 구간 경계에서 멈춘다 — "그룹이 다르면 이동 무시" 로 처리하면 드래그가 여러 칸을 건너뛰는 탓에 아무 일도 안 일어나 고장난 것처럼 보인다 ② 반대로 일반열을 고정 구간 위로 끌어도 마찬가지다 ③ 손잡이 title 이 왜 더 못 가는지 알린다 ④ 적용 후 표를 가로로 끝까지 밀어 본다 — 고정열이 흩어지면 스크롤 시 좌우가 갈라져 읽을 수 없다(그래서 applyColumnPreference 가 저장값과 무관하게 선두 연속 구간으로 되돌린다) ⑤ 상단의 「고정열 수」가 항상 2 여야 한다.',
      file: 'src/client/ui-test/docs/demos/column-settings/pinned.tsx',
      Component: ColumnSettingsPinnedDemo,
    },
    {
      id: 'preference',
      title: 'useGridPreference 연동 — 저장 · 초기화 · 나중에 늘어난 컬럼',
      note: '검증 포인트 — ① 숨김·순서를 적용하고 새로고침해도 유지된다(localStorage, 키는 사용자·메뉴·그리드 3축) ② 「초기화」는 컬럼 설정만 지우고 페이지 크기는 남긴다 ③ 초기화 직후 다시 연 목록에서 정의상 hidden:true 인 「상태」 컬럼이 체크 해제 상태로 보여야 한다 — 저장 당시 없던 컬럼(order 에 없음)은 저장값이 아니라 정의의 hidden 을 따르기 때문이고, 이게 어긋나면 표와 목록이 서로 다른 것을 말한다 ④ 「나중에 컬럼이 늘었다」를 켜면 저장 이후 추가된 컬럼이 목록 뒤에 붙고 사라지지 않는다 — 설정을 저장한 뒤 배포로 컬럼이 늘면 그 컬럼이 영영 안 보이는 사고가 여기서 막힌다.',
      file: 'src/client/ui-test/docs/demos/column-settings/preference.tsx',
      Component: ColumnSettingsPreferenceDemo,
    },
  ],
  propsTables: [
    {
      title: 'ColumnSettingsDialog',
      rows: definePropRows<ColumnSettingsProps>()([
        { name: 'open', type: 'boolean', required: true, description: '열림 상태.' },
        {
          name: 'onOpenChange',
          type: '(open: boolean) => void',
          required: true,
          description: '닫기 — 취소로 닫아도 draft 는 버려진다(다음에 열 때 다시 만든다).',
        },
        {
          name: 'columns',
          type: 'readonly ColumnDef<T>[]',
          required: true,
          description:
            '**숨김이 적용되기 전의 원본 컬럼 정의**를 넘긴다 — 꺼진 컬럼도 목록에 있어야 다시 켤 수 있다. 그리드에는 applyColumnPreference 를 통과한 적용본을 넘기므로 두 값이 다르다.',
        },
        {
          name: 'preference',
          type: 'GridPreference | null',
          required: true,
          description:
            '저장된 설정. null 은 "아직 로드 전이거나 저장된 것이 없다"는 뜻이고, 그때는 컬럼 정의의 기본값(hidden)을 따른다.',
        },
        {
          name: 'onApply',
          type: "(next: Pick<GridPreference, 'hidden' | 'order'>) => void",
          required: true,
          description:
            '적용 — hidden·order 를 한 번에 넘긴다. 폭(widths)은 그리드 쪽이 따로 관리한다.',
        },
        {
          name: 'onReset',
          type: '() => void',
          required: true,
          description: '컬럼 설정만 지운다 — 페이지 크기는 남는다(useGridPreference.reset 과 짝).',
        },
        {
          name: 'translateHeader',
          type: '(code: string) => string',
          description: 'headerWord 가 코드일 때의 표시 변환 — 그리드에 준 것과 같은 함수를 준다.',
        },
        {
          name: 'labels',
          type: 'ColumnSettingsLabels',
          required: true,
          description: '전 문구 주입 — ui 는 사전을 모른다.',
        },
      ]),
    },
    {
      title: 'ColumnSettingsLabels',
      rows: definePropRows<ColumnSettingsLabels>()([
        { name: 'title', type: 'string', required: true, description: '모달 제목.' },
        { name: 'description', type: 'string', required: true, description: '제목 아래 보조 줄.' },
        {
          name: 'reorder',
          type: 'string',
          required: true,
          description: '손잡이의 스크린리더 이름 — 아이콘 단독이라 없으면 빈 버튼이 된다.',
        },
        {
          name: 'reorderHint',
          type: 'string',
          required: true,
          description:
            '조작 방법 안내. **드래그는 눈에 보이지만 화살표 키는 알려주지 않으면 아무도 모른다.**',
        },
        {
          name: 'reorderAnnouncement',
          type: '(name, position, total) => string',
          required: true,
          description:
            '이동 결과의 sr-only aria-live 문장. 드래그는 순전히 시각적 조작이라 **이게 없으면 화면을 못 보는 사용자에게는 아무 일도 일어나지 않은 것과 같다.** 함수로 주입받는 이유는 ui 가 사전을 모르기 때문이다.',
        },
        {
          name: 'visibleColumn',
          type: 'string',
          required: true,
          description: '표시 체크박스 열 이름.',
        },
        {
          name: 'alwaysVisible',
          type: 'string',
          required: true,
          description: '끌 수 없는 컬럼(hideable:false)의 사유 — 왜 못 누르는지 적는다.',
        },
        {
          name: 'pinnedFixed',
          type: 'string',
          required: true,
          description: '고정열이 일반열 영역으로 못 내려가는 사유.',
        },
        { name: 'reset', type: 'string', required: true, description: '초기화 버튼.' },
        { name: 'cancel', type: 'string', required: true, description: '취소 버튼.' },
        { name: 'apply', type: 'string', required: true, description: '적용 버튼.' },
      ]),
    },
  ],
};
