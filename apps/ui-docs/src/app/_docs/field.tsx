import type { FieldProps } from '@hvy/ui';
import { FieldMixedModeDemo } from '../../client/ui-test/docs/demos/field/mixed-mode';
import { FieldStatesDemo } from '../../client/ui-test/docs/demos/field/states';
import { FieldViewEditDemo } from '../../client/ui-test/docs/demos/field/view-edit';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Field, Input } from '@hvy/ui';

<Field label="제목" htmlFor="subject" required error={errors.subject}>
  <Input id="subject" placeholder="제목 입력" />
</Field>`;

/** Field 문서 — 라벨·필수 표시·헬퍼·오류를 접근성 속성으로 배선하는 래퍼. */
export const fieldDoc: DocEntry = {
  slug: 'field',
  category: 'components',
  title: 'Field',
  description:
    '폼 한 칸의 래퍼 — 라벨·필수 표시·가이드(help)·오류(error)를 자식 컨트롤의 aria-* 로 자동 배선한다. error 가 있으면 자식이 오류 배색 + aria-invalid 를 입고 help 는 감춰진다. 필수값 오류를 모달로 막지 않는다(v3 §ds-05) — 못 채운 칸 전부에 동시에 표시한다. 모드 축의 폼 배선 지점이기도 하다 — Field 가 mode 를 해석해 컨텍스트로 내리고 view 크롬(라벨 span 화·오류 배선 절단)을 그리므로, 폼이 view/disabled 여도 <Field mode="edit"> 가 그 칸만 연다(오버라이드 지점). 읽기 전용 축은 넷이고 서로 직교한다 — FieldValue(영구 조회)·lock(칸 수준 영구 불변)·masking(마스킹된 개인정보)·mode(폼 수준). 계약 정본은 packages/ui/README.md "폼 컨트롤 상태 계약 (mode · lock · masking)".',
  usage: USAGE,
  examples: [
    {
      id: 'states',
      title: '배선 전수',
      note: '기본 · 필수(RequiredMark) · 가이드(help) · 오류(error) — 오류 문구는 role=alert 라 스크린리더가 즉시 읽는다.',
      file: 'src/client/ui-test/docs/demos/field/states.tsx',
      Component: FieldStatesDemo,
    },
    {
      id: 'view-edit',
      title: '3모드 — edit · view · disabled',
      note: 'FormMode 하나로 폼 전체가 전환된다. view 는 값 텍스트(입력 DOM 제거 — 폼 값이 안 나와 전환 폼은 제어형 필수), disabled 는 컨트롤 유지 + 비활성(FormData 제외 — 비제어 허용, form-save 시나리오 참조). 미선택 칸은 placeholder 가 아니라 빈칸, Checkbox/Switch 는 viewLabels 주입(누락 시 콘솔 경고), password 는 값 길이와 무관한 고정 ********, 표시값≠편집값 칸은 Field 의 view 가 덮는다. 모드를 토글해도 행 높이가 튀지 않는다(VALUE_MIN_H_CLASS ↔ FIELD_SIZE_CLASS 파리티). 규칙 정본은 packages/ui/README.md "폼 컨트롤 상태 계약 (mode · lock · masking)".',
      file: 'src/client/ui-test/docs/demos/field/view-edit.tsx',
      Component: FieldViewEditDemo,
    },
    {
      id: 'mixed-mode',
      title: '혼합 모드 — Field mode="edit" 와 lock',
      note: '폼 모드와 무관하게 자기 상태를 지키는 두 칸의 대비. 폼이 view 여도 <Field mode="edit"> 칸은 편집이 열려 있다(단독 상태 유지) — Field 로 감싼 칸은 Field 가 view 크롬을 그리므로 컨트롤이 아니라 Field 의 mode 가 오버라이드 지점이다. 반대로 lock 칸은 폼을 edit 로 토글해도 잠겨 있다 — lock 은 모든 mode 를 이긴다(값은 readOnly 라 FormData 에는 실린다). edit/view 를 오가며 두 칸이 폼 모드를 무시하는 것을 확인한다.',
      file: 'src/client/ui-test/docs/demos/field/mixed-mode.tsx',
      Component: FieldMixedModeDemo,
    },
  ],
  propsTables: [
    {
      title: 'Field',
      rows: definePropRows<FieldProps>()([
        {
          name: 'htmlFor',
          type: 'string',
          required: true,
          description: '연결할 컨트롤의 id — 접근성 요건이라 선택이 아니다.',
        },
        {
          name: 'label',
          type: 'ReactNode',
          required: true,
          description: '라벨. 툴팁 아이콘 같은 조합물도 받는다(Tooltip 문서의 레이블 툴팁 참조).',
        },
        {
          name: 'required',
          type: 'boolean',
          description: '필수 표시(*) — RequiredMark 를 라벨 뒤에 붙인다.',
        },
        {
          name: 'error',
          type: 'ReactNode',
          description:
            '오류 문구. 있으면 자식 컨트롤이 자동으로 오류 배색 + aria-invalid 를 입는다.',
        },
        {
          name: 'help',
          type: 'ReactNode',
          description: '보조 설명. 오류가 있으면 감춘다 — 둘 다 읽히면 스크린리더가 시끄럽다.',
        },
        {
          name: 'layout',
          type: "'stack' | 'inline'",
          defaultValue: "'stack'",
          description:
            'stack 은 라벨이 위(로그인·모달), inline 은 라벨과 컨트롤이 각각 grid item 이 된다(검색 필터의 dl-filter-grid 트랙용).',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '안의 컨트롤들에 컨텍스트로 내려간다 — 컨트롤의 명시 size 가 이긴다.',
        },
        {
          name: 'onDirty',
          type: '() => void',
          description: '값이 바뀌면 호출 — useFieldErrors().bind() 가 이걸 채운다.',
        },
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          defaultValue: "'edit'",
          description:
            '폼 모드 — 생략하면 감싼 FormMode 의 값. view 는 값 텍스트(폼 값이 안 나와 전환 폼은 제어형 필수), disabled 는 컨트롤 유지 + 비활성(FormData 제외). 명시 prop 이 FormMode 를 이긴다 — Field 로 감싼 칸은 여기가 오버라이드 지점이다(조회 화면에서 특정 칸만 열기).',
        },
        {
          name: 'view',
          type: 'ReactNode',
          description:
            'view 모드 표시값 오버라이드 — 표시값≠편집값일 때(단위 붙은 수치, Badge 상태 등). 있으면 children 대신 그린다. edit/disabled 에서는 무시.',
        },
        {
          name: 'className',
          type: 'string',
          description:
            'stack 은 칸 전체 래퍼, inline 은 컨트롤 영역에 붙는다 — 격자에서 전폭 칸은 col-span-full 을 준다.',
        },
      ]),
    },
  ],
};
