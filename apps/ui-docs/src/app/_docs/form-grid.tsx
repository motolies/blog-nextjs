import type { FieldValue, FormGrid } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { FormGridBasicDemo } from '../../client/ui-test/docs/demos/form-grid/basic';
import { FormGridDetailModesDemo } from '../../client/ui-test/docs/demos/form-grid/detail-modes';
import { FormGridMessagesDemo } from '../../client/ui-test/docs/demos/form-grid/messages';
import { FormGridReadonlyDemo } from '../../client/ui-test/docs/demos/form-grid/readonly';
import { FormGridSectionsDemo } from '../../client/ui-test/docs/demos/form-grid/sections';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Field, FieldValue, FormGrid, Input, Textarea } from '@hvy/ui';

<FormGrid>
  <Field label="수신자명" htmlFor="name" required>
    <Input id="name" />
  </Field>
  <Field label="주문일" htmlFor="date" required>
    <DatePicker id="date" />
  </Field>

  {/* 한 줄을 다 쓰는 칸 */}
  <Field label="메모" htmlFor="memo" className="col-span-full">
    <Textarea id="memo" />
  </Field>

  {/* 읽기 전용 값 */}
  <FieldValue label="주문번호">ORD-100024</FieldValue>
</FormGrid>`;

/**
 * 폼 본문 — 읽기 전용 3축과 폼 모드 계약의 결정표.
 * 규칙 정본은 packages/ui/README.md "폼 컨트롤 3모드"다 — 여기는 화면용 요약이다.
 */
function FormGridModesBody() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-dl-xl font-bold text-dl-fg-strong">읽기 전용 축은 셋이다</h2>
        <p className="text-dl-sm text-dl-fg-muted">
          "이 칸은 왜 못 고치는가"의 답이 셋으로 갈린다 — 답이 다르면 쓰는 도구도 다르다. 같은 격자
          안에서 셋이 섞이는 것이 상세 폼의 일반적인 모습이고, 값 칸 최소 높이 파리티(VALUE_MIN_H ↔
          FIELD_SIZE_CLASS) 덕에 어떤 조합이든 행이 맞는다.
        </p>
        <div className="overflow-x-auto rounded-dl-container border border-dl-border bg-dl-surface">
          <table className="w-full text-dl-sm">
            <thead>
              <tr className="border-b border-dl-border bg-dl-grid-header text-left text-dl-grid-header-fg">
                <th className="px-4 py-2 font-semibold">축</th>
                <th className="px-4 py-2 font-semibold">뜻</th>
                <th className="px-4 py-2 font-semibold">도구</th>
              </tr>
            </thead>
            <tbody className="[&_td]:px-4 [&_td]:py-2 [&_tr]:border-b [&_tr]:border-dl-divider">
              <tr>
                <td>영구 조회</td>
                <td>애초에 고칠 대상이 아니다 — 시간 개념이 없다(주문번호·등록일시)</td>
                <td>
                  <code className="font-dl-mono">FieldValue</code>
                </td>
              </tr>
              <tr>
                <td>잠금</td>
                <td>지금은 못 고친다 — 마스킹·자동입력·조건부. 칸 수준</td>
                <td>
                  <code className="font-dl-mono">lock="auto | readonly | disabled"</code>
                </td>
              </tr>
              <tr>
                <td>모드 조회</td>
                <td>지금은 조회 중이고 모드를 바꾸면 편집 — 폼 수준</td>
                <td>
                  <code className="font-dl-mono">FormMode</code> /{' '}
                  <code className="font-dl-mono">Field mode</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-dl-sm text-dl-fg-muted">
          판정은 한 문장이다 —{' '}
          <strong>모드를 오가는 화면이면 FieldValue 가 아니라 Field mode="view"</strong> 를 쓴다. 세
          축은 직교한다: mode≠edit 이어도 lock 은 지워지지 않고 잠복하며, edit 복귀 시 그대로
          복원된다(OR 합성).
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-dl-xl font-bold text-dl-fg-strong">폼 모드 계약 (FieldMode)</h2>
        <div className="overflow-x-auto rounded-dl-container border border-dl-border bg-dl-surface">
          <table className="w-full text-dl-sm">
            <thead>
              <tr className="border-b border-dl-border bg-dl-grid-header text-left text-dl-grid-header-fg">
                <th className="px-4 py-2 font-semibold">모드</th>
                <th className="px-4 py-2 font-semibold">DOM</th>
                <th className="px-4 py-2 font-semibold">폼 값(FormData)</th>
                <th className="px-4 py-2 font-semibold">배색</th>
              </tr>
            </thead>
            <tbody className="[&_td]:px-4 [&_td]:py-2 [&_tr]:border-b [&_tr]:border-dl-divider">
              <tr>
                <td>
                  <code className="font-dl-mono">edit</code> (기본)
                </td>
                <td>편집 컨트롤</td>
                <td>O</td>
                <td>현행</td>
              </tr>
              <tr>
                <td>
                  <code className="font-dl-mono">view</code>
                </td>
                <td>입력 요소 제거, 값 텍스트만 — 미선택/빈값은 빈칸(placeholder 금지)</td>
                <td>
                  <strong>X</strong> → view↔edit 전환 폼은 제어형 필수
                </td>
                <td>없음(텍스트)</td>
              </tr>
              <tr>
                <td>
                  <code className="font-dl-mono">disabled</code>
                </td>
                <td>편집 컨트롤 유지 + disabled — 필수 별표만 숨김</td>
                <td>
                  <strong>X</strong> (네이티브 규약) — 비제어 허용
                </td>
                <td>dl-field-locked (박스형은 전용 disabled 토큰)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-dl-sm text-dl-fg-muted">
          병합은{' '}
          <code className="font-dl-mono">명시 prop &gt; Field &gt; FormMode &gt; 'edit'</code> —
          조회 화면에서 특정 칸만 여는 예외가 같은 prop 으로 표현된다.
          켜짐/꺼짐형(Checkbox·Switch)은 viewLabels 를 주입받고, 표시값 ≠ 편집값 칸은 Field 의 view
          가 덮는다. FormMode 는 폼에만 감는다 — 그리드 크롬(DataGrid 등)은 내부에서 edit 로 핀되어
          있다. 규칙 정본은 packages/ui/README.md "폼 컨트롤 3모드".
        </p>
      </div>
    </section>
  );
}

/** FormGrid 문서 — 상세 폼은 div 격자다(구 FormTable 대체). */
export const formGridDoc: DocEntry = {
  slug: 'form-grid',
  category: 'components',
  title: 'FormGrid',
  description:
    '상세 폼 격자 — div + CSS Grid 다. 라벨은 컨트롤 위에 오고 열 수는 카드 폭이 정한다(auto-fit). 한 줄을 다 쓰는 칸만 col-span-full 로 표시한다. 조회↔수정 전환은 격자가 아니라 모드 축(FormMode / Field mode)이 맡는다 — FormGrid 는 레이아웃 상자라 무변경(RSC 유지)이고, 아래 본문의 "읽기 전용 3축" 결정표를 먼저 본다. 구 FormTable(<table> + 회색 라벨 칸)을 대체한다 — rowSpan 사용처가 하나도 없어 표 구조를 쓸 근거가 없었고, 그리드 헤더와 같은 회색 배경은 "이건 표의 머리다"라는 뜻이라 상세 폼에 맞지 않았다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '상세 폼',
      note: '카드 + 격자 + Field(라벨 위). 배송지·메모는 col-span-full, 주문번호는 lock=auto 다. 카드 폭이 좁아지면 열이 스스로 줄어든다 — 컨테이너 쿼리 래퍼가 필요 없다. 저장을 누르면 필수 네 칸과 형식(연락처·금액)을 검사한다: 타이핑은 막지 않고 칸을 벗어날 때 정리하며(연락처는 숫자와 -, 금액은 천단위 콤마), 소수 자릿수를 넘긴 금액은 값을 자르지 않고 오류로 알린다 — 돈이 조용히 바뀌면 잘려나간 사실이 화면에 남지 않는다. 금액은 표시값과 전송값이 달라 hidden 입력이 콤마 없는 값을 싣는다(폼 아래 전송값 표시 참조).',
      file: 'src/client/ui-test/docs/demos/form-grid/basic.tsx',
      Component: FormGridBasicDemo,
    },
    {
      id: 'sections',
      title: '섹션 분리',
      note: '카드 셋 · 격자 셋 · 폼 하나. 의미가 다른 덩어리는 격자를 나누지 않고 카드를 나눈다 — FormGrid 에 섹션 API 가 없는 이유다. 폭을 카드가 아니라 바깥 폼이 쥐므로(max-w-4xl) 세 카드가 같은 폭이 되고, auto-fit 이 세 곳에서 같은 열 수를 뽑는다: 창을 줄이면 셋이 동시에 접힌다. 카드마다 폭을 따로 주면 이 정렬이 조용히 깨져 한 폼이 아니라 격자 세 벌처럼 읽힌다. 보내는 사람과 받는 사람의 필드 순서를 같게 둔 것도 같은 이유다 — 이름·연락처·국가가 두 카드에서 같은 세로선 위에 온다. col-span-full 은 세 가지 이유로만 쓴다: 값이 길어서(주소) · 한 칸에 컨트롤이 여럿이라 220px 트랙에 못 들어가서(박스규격 가로×세로×높이) · 여러 줄이라서(배송 요청사항). 우편번호는 컨트롤이 둘(입력 + 검색)인데도 전폭이 아니다 — 기준은 컨트롤 개수가 아니라 최소 트랙 폭에 들어가는가다. 저장·취소는 카드 밖 마지막 한 줄에 둔다: 저장 단위가 폼 전체 하나라서, 카드 안에 넣으면 그 카드만 저장된다는 뜻이 된다(카드가 하나뿐인 상세 폼 예제는 카드 안 하단이 맞았다). 상태와 검증은 넣지 않았다 — 이 예제가 증명하는 것은 배치이고 배치는 값이 바뀌어도 변하지 않는다. 값 배선은 상세 폼 예제가 갖는다.',
      file: 'src/client/ui-test/docs/demos/form-grid/sections.tsx',
      Component: FormGridSectionsDemo,
    },
    {
      id: 'messages',
      title: '메시지와 행 정렬',
      note: '오류 칸은 세로로 길어진다. align-items:start 라 짧은 칸이 늘거나 밀리지 않고 라벨 윗선이 한 줄에 남는다 — 저장 한 번에 여러 칸이 동시에 오류를 뿜는 것이 정상 동작이라 그때 배치가 흔들리면 안 된다.',
      file: 'src/client/ui-test/docs/demos/form-grid/messages.tsx',
      Component: FormGridMessagesDemo,
    },
    {
      id: 'readonly',
      title: '읽기 전용 — FieldValue',
      note: 'FieldValue 는 Field 와 같은 세로 리듬을 쓰되 오류·필수 표시가 없다. 읽기 전용 축은 셋이고 이건 그중 "영구 조회"다 — lock 은 "지금은 못 고친다"(칸 수준), FieldValue 는 "애초에 고칠 대상이 아니다"(시간 개념 없음), mode 는 "지금은 조회 중이고 모드를 바꾸면 편집"(폼 수준). 조회↔수정을 오가는 화면이면 FieldValue 가 아니라 Field mode="view" 를 쓴다 — 아래 상세 폼 조회↔수정 예제가 그 대비다.',
      file: 'src/client/ui-test/docs/demos/form-grid/readonly.tsx',
      Component: FormGridReadonlyDemo,
    },
    {
      id: 'detail-modes',
      title: '상세 폼 조회↔수정 — FormMode',
      note: '실전형 상세 폼: FormMode 하나로 카드·격자 전체가 전환된다. 한 격자 안에 FieldValue(영구 조회 — 주문번호·등록일시), Field(모드 조회), Field mode="edit"(조회 중에도 열린 관리 메모)가 공존하고, 모드를 토글해도 행이 계속 맞는다 — FieldValue 와 view 모드가 같은 값 칸 규격(VALUE_MIN_H 파리티)을 쓰기 때문이다. 표시값≠편집값인 주문상태는 Field 의 view 가 Badge 로 덮는다. view 는 입력 DOM 을 없애 폼 값이 안 나오므로 이 폼은 제어형이다 — 비제어(FormData) + disabled 전환의 실례는 폼 저장·검증 시나리오 참조.',
      file: 'src/client/ui-test/docs/demos/form-grid/detail-modes.tsx',
      Component: FormGridDetailModesDemo,
    },
  ],
  Body: FormGridModesBody,
  propsTables: [
    {
      title: 'FormGrid',
      rows: definePropRows<ComponentProps<typeof FormGrid>>()([
        {
          name: 'className',
          type: 'string',
          description:
            '열 수를 강제할 때만 쓴다(예: grid-cols-1). 기본은 열 최소 폭 220px 기준 auto-fit 이다 — 폼 카드에서 3열, 모달 본문에서 2열이 된다.',
        },
      ]),
    },
    {
      title: 'FieldValue',
      rows: definePropRows<ComponentProps<typeof FieldValue>>()([
        {
          name: 'label',
          type: 'ReactNode',
          description:
            '값 위에 놓이는 라벨. htmlFor 가 없다 — 연결할 컨트롤이 없기 때문이다. Field mode="view" 와의 구분: FieldValue 는 애초에 고칠 대상이 아닌 값(영구 조회), mode="view" 는 모드를 바꾸면 편집으로 돌아오는 칸이다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description:
            '나란히 놓이는 편집 칸들과 같은 값이어야 행이 맞는다 — 값 칸 최소 높이가 같은 size 컨트롤 높이와 같은 토큰에서 유도된다(VALUE_MIN_H 파리티).',
        },
        {
          name: 'className',
          type: 'string',
          description: '전폭 칸은 col-span-full 을 준다.',
        },
      ]),
    },
  ],
};
