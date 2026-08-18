import type { InputProps, TextareaProps } from '@hvy/ui';
import { InputMatrixDemo } from '../../client/ui-test/docs/demos/input/matrix';
import { InputModesDemo } from '../../client/ui-test/docs/demos/input/modes';
import { InputPlaygroundDemo } from '../../client/ui-test/docs/demos/input/playground';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Field, Input, Textarea } from '@hvy/ui';

<Field label="수신자명" htmlFor="receiver" error={errors.receiver}>
  <Input id="receiver" placeholder="수신자명 입력" />
</Field>`;

/** Input · Textarea 문서 — 잠금 3종과 상태 3열이 핵심이다. */
export const inputDoc: DocEntry = {
  slug: 'input',
  category: 'components',
  title: 'Input',
  description:
    '텍스트 입력 계열(Input · Textarea). 잠금 3종의 의미 구분(auto/readonly/disabled)이 핵심이고, 오류 표시는 Field 의 error 가 자동 배선한다. 읽기 전용 축은 셋이다 — lock(칸 수준) · FieldValue(영구 조회) · mode(폼 수준, FormMode/Field): view 모드는 입력 DOM 을 없애고 값 텍스트만 남긴다(password 는 값 길이와 무관한 고정 ********, Textarea 는 줄바꿈 보존). hover 보더는 primary, focus 보더는 primary-hover(QA). 날짜 칸은 DatePicker 를 쓴다 — 달력이 안 열리는 DateInput 은 어포던스가 거짓이라 제거했다.',
  usage: USAGE,
  examples: [
    {
      id: 'playground',
      title: 'Input',
      note: '잠금 3종의 배색은 같고 의미만 다르다 — auto·readonly 는 readOnly(값 전송됨), disabled 만 전송에서 빠진다. lock=auto 에서 placeholder 를 지우면 개발 경고가 나는 것도 확인해 볼 것.',
      file: 'src/client/ui-test/docs/demos/input/playground.tsx',
      Component: InputPlaygroundDemo,
    },
    {
      id: 'matrix',
      title: '상태 매트릭스 — 기본 · 비활성 · 오류',
      note: 'QA component.html 의 3열 패턴(Input · Textarea · DatePicker). 오류는 보더만 danger 로 바뀌고(배경 틴트 없음) 아래 12px 헬퍼 텍스트가 붙는다. 날짜 칸도 같은 dl-field 껍데기라 상태 규격이 같다. 폼 모드 축(view/disabled)은 아래 3모드 예제가 다룬다.',
      file: 'src/client/ui-test/docs/demos/input/matrix.tsx',
      Component: InputMatrixDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: '열마다 FormMode 로 감은 정적 대비. view 는 값 텍스트만 남고 행 높이가 편집 컨트롤과 같다(VALUE_MIN_H 파리티) · password 는 값 길이와 무관한 고정 ******** — 평문도 길이도 노출하지 않는다 · lock="auto" 는 disabled 모드에서도 자물쇠가 유지된다(mode 와 lock 은 OR 합성) · Textarea 는 줄바꿈을 보존한다. 모드 왕복·값 보존은 Field 문서의 3모드 데모 참조.',
      file: 'src/client/ui-test/docs/demos/input/modes.tsx',
      Component: InputModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'Input',
      rows: definePropRows<InputProps>()([
        {
          name: 'lock',
          type: "'auto' | 'readonly' | 'disabled'",
          description:
            'auto = 시스템이 채움(항상 수정 불가·값 전송 O), readonly = 지금은 못 고침(열람으로 풀림), disabled = 지금은 쓸 수 없음(전송 제외). 배색은 셋 다 같다. 폼 수준 mode="disabled" 와는 OR 합성 — mode 는 lock 을 지우지 않고 잠복시켜 edit 복귀 시 그대로 복원된다.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description: 'Field 밖에서 단독으로 쓸 때만. Field 안이면 error 컨텍스트가 이긴다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description:
            '테마 스케일 유도 5단(default 높이 32/36/42/46/52). 생략하면 감싼 Field 의 size 를 따른다.',
        },
        {
          name: 'align',
          type: "'left' | 'center'",
          defaultValue: "'left'",
          description: '숫자 칸은 가운데, 폼 안 숫자는 왼쪽 — v3 가 명시적으로 반대 규칙을 둔다.',
        },
      ]),
    },
    {
      title: 'Textarea',
      rows: definePropRows<TextareaProps>()([
        {
          name: 'lock',
          type: "'auto' | 'readonly' | 'disabled'",
          description: 'Input 과 같은 잠금 3종.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description: 'Field 밖 단독 사용 시의 오류 배색.',
        },
      ]),
    },
  ],
};
