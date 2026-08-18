import type { FormSection } from '@hvy/ui';
import type { ComponentProps } from 'react';
import {
  FormSectionBasicDemo,
  FormSectionCollapsibleDemo,
} from '../../client/ui-test/docs/demos/form-section/basic';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Field, FormSection, Input } from '@hvy/ui';

<FormSection title="주문 기본 정보" actions={<Button size="sm">저장</Button>}>
  <Field label="주문번호" htmlFor="orderId">
    <Input id="orderId" lock placeholder="자동 / 저장 시 발급" />
  </Field>
</FormSection>`;

/** FormSection 문서 — Card + CardHeader + FormGrid 3중주 래퍼. */
export const formSectionDoc: DocEntry = {
  slug: 'form-section',
  category: 'layout',
  title: 'FormSection',
  description:
    '상세 폼 섹션 — Card(form) + CardHeader + FormGrid 3중주의 래퍼다. 상세·등록 화면이 섹션마다 이 3중주를 복제하던 것을 흡수한다 — 구성물 셋이 전부 ui 소유이고 도메인·데이터 배선을 모르므로 레이아웃 프리미티브다(FormGrid 와 같은 급). children 은 Field/FieldValue 이고 FormGrid 에 그대로 담긴다 — 격자가 아닌 내용(서브 그리드 등)은 이 래퍼가 아니라 Card 를 직접 쓴다. collapsible 이면 제목이 접기 토글이 된다(aria-expanded·키보드는 radix Collapsible 몫). FormMode 는 소비하지 않고 통과시킨다 — 섹션은 폼 상태의 주체가 아니다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '기본 — 3중주가 prop 몇 개로',
      note: 'CardHeader 의 배치 규칙이 그대로다 — 오른쪽 끝이 주 실행 자리, 파괴적 액션(destructive)은 왼쪽 끝으로 분리된다. 격자는 auto-fit 이라 카드 폭이 열 수를 정한다.',
      file: 'src/client/ui-test/docs/demos/form-section/basic.tsx',
      Component: FormSectionBasicDemo,
    },
    {
      id: 'collapsible',
      title: '접기 (collapsible)',
      note: '제목 클릭·Enter 로 접고 편다 — 화살표가 상태를 알리고 aria-expanded 는 radix 가 단다. 접힘 상태는 세션 휘발이다(영속이 필요해지면 그때 연다). defaultOpen={false} 로 접힌 채 시작할 수 있다.',
      file: 'src/client/ui-test/docs/demos/form-section/basic.tsx',
      Component: FormSectionCollapsibleDemo,
    },
  ],
  propsTables: [
    {
      title: 'FormSection',
      rows: definePropRows<ComponentProps<typeof FormSection>>()([
        {
          name: 'title',
          type: 'ReactNode',
          required: true,
          description: '섹션 제목 — collapsible 이면 접기 토글이 된다.',
        },
        {
          name: 'aside',
          type: 'ReactNode',
          description: '제목 옆 보조 표시 — CardHeader 의 aside 그대로.',
        },
        {
          name: 'destructive',
          type: 'ReactNode',
          description: '파괴적 액션 — 주 실행(오른쪽 끝)과 분리된 왼쪽 자리(CardHeader 규칙).',
        },
        {
          name: 'actions',
          type: 'ReactNode',
          description: '오른쪽 끝 주 실행 액션들.',
        },
        {
          name: 'collapsible',
          type: 'boolean',
          description: '제목을 접기 토글로 — 긴 상세 화면에서 안 쓰는 섹션을 접는 용도.',
        },
        {
          name: 'defaultOpen',
          type: 'boolean',
          defaultValue: 'true',
          description: '접기 초기 상태 — 상태는 세션 휘발이다.',
        },
        {
          name: 'children',
          type: 'ReactNode',
          required: true,
          description: 'Field/FieldValue 항목들 — FormGrid 에 그대로 담긴다.',
        },
        {
          name: 'className',
          type: 'string',
          description: 'Card 에 병합되는 클래스.',
        },
      ]),
    },
  ],
};
