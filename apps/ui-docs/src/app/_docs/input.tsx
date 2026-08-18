import type { InputProps, TextareaProps } from '@hvy/ui';
import { InputMaskingDemo } from '../../client/ui-test/docs/demos/input/masking';
import { InputMatrixDemo } from '../../client/ui-test/docs/demos/input/matrix';
import { InputModesDemo } from '../../client/ui-test/docs/demos/input/modes';
import { InputPlaygroundDemo } from '../../client/ui-test/docs/demos/input/playground';
import { InputShowCountDemo } from '../../client/ui-test/docs/demos/input/show-count';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Field, Input, Textarea } from '@hvy/ui';

<Field label="수신자명" htmlFor="receiver" error={errors.receiver}>
  <Input id="receiver" placeholder="수신자명 입력" />
</Field>`;

/** Input · Textarea 문서 — 상태 계약(mode·lock·masking)과 어도먼트가 핵심이다. */
export const inputDoc: DocEntry = {
  slug: 'input',
  category: 'components',
  title: 'Input',
  description:
    '텍스트 입력 계열(Input · Textarea). 상태 축은 셋이고 서로 직교한다 — mode(edit·view·disabled, 폼 수준에서 상속)·lock(시스템 채움 영구 불변 — 모든 mode 를 이기고 값은 전송된다)·masking(서버가 마스킹한 개인정보 — name 미전달로 전송 제외). 비활성 표기는 mode="disabled" 하나다 — disabled boolean prop 은 타입에서 제거됐다. 오류 표시는 Field 의 error 가 자동 배선하고, placeholder·type 등 네이티브 속성은 그대로 통과한다. view 모드는 입력 DOM 을 없애고 값 텍스트만 남긴다(password 는 값 길이와 무관한 고정 ******** — 마스킹과 같은 시각 언어, Textarea 는 줄바꿈 보존). 어도먼트는 prefix/suffix + clearable(×) — 우측 슬롯 우선순위는 자물쇠 > × > suffix 이고 자물쇠와 × 는 상호 배타다(잠긴 값은 못 지운다). 날짜 칸은 DatePicker 를 쓴다 — 달력이 안 열리는 DateInput 은 어포던스가 거짓이라 제거했다. 계약 정본은 packages/ui/README.md "폼 컨트롤 상태 계약 (mode · lock · masking)".',
  usage: USAGE,
  examples: [
    {
      id: 'playground',
      title: 'Input',
      note: '상태 축 셋(mode·lock·masking)을 직접 조합해 본다 — lock 은 mode 가 edit 여도 잠기고 값은 전송되며(readOnly + 자물쇠), masking 은 전용 배색(기울임)에 name 미전달로 전송에서 빠진다. clearable 은 제어형 전용(× 는 onClear 를 부를 뿐 값을 직접 지우지 않는다)이고, lock 과 함께 켜면 × 가 사라진다 — 자물쇠↔× 상호 배타. lock 에서 placeholder 를 지우면 개발 경고("자동 / 저장 시 발급" 형식 안내)가 나는 것도 확인해 볼 것. Textarea 의 autosize 는 내용을 따라 높이가 자란다(상한 있음).',
      file: 'src/client/ui-test/docs/demos/input/playground.tsx',
      Component: InputPlaygroundDemo,
    },
    {
      id: 'matrix',
      title: '상태 매트릭스 — 기본 · 비활성 · 오류',
      note: 'QA component.html 의 3열 패턴(Input · Textarea · DatePicker). 비활성 열은 mode="disabled" 다 — 비활성 표기는 이 축 하나다. 오류는 보더만 danger 로 바뀌고(배경 틴트 없음) 아래 12px 헬퍼 텍스트가 붙는다. 날짜 칸도 같은 dl-field 껍데기라 상태 규격이 같다. 폼 모드 전환은 아래 3모드 예제가 다룬다.',
      file: 'src/client/ui-test/docs/demos/input/matrix.tsx',
      Component: InputMatrixDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: '열마다 FormMode 로 감은 정적 대비. view 는 값 텍스트만 남고 행 높이가 편집 컨트롤과 같다(VALUE_MIN_H 파리티) · password 는 값 길이와 무관한 고정 ******** — 평문도 길이도 노출하지 않는다 · lock 은 모든 mode 를 이긴다 — disabled 모드에서도 자물쇠가 유지되고 edit 로 돌아와도 편집 불가다(값은 전송) · Textarea 는 줄바꿈을 보존한다. 모드 왕복·값 보존은 Field 문서의 3모드 데모 참조.',
      file: 'src/client/ui-test/docs/demos/input/modes.tsx',
      Component: InputModesDemo,
    },
    {
      id: 'show-count',
      title: '글자수 카운터 (showCount)',
      note: '제어형 + maxLength 전용이다(clearable 과 같은 규약 — 텍스트형은 값을 미러링하지 않아 비제어에서는 길이를 알 수 없다). 상한 강제는 네이티브 maxLength 가 하고 카운터는 시각 보조(aria-hidden)다. 편집 가능한 상태에서만 보인다 — 잠긴 값의 카운터는 소음이다.',
      file: 'src/client/ui-test/docs/demos/input/show-count.tsx',
      Component: InputShowCountDemo,
    },
    {
      id: 'masking',
      title: '마스킹 — 저장 사고의 구조적 방어',
      note: '서버가 이미 마스킹해 내려준 값(a***@b.com)의 선언이다 — 클라이언트가 변환하지 않는다. FormData 덤프에서 마스킹 칸의 키 자체가 사라지는 것을 확인한다: name 미전달이 마스킹값 저장 사고(실값 파괴 — 현행에 실제 사고 사례가 있다)의 구조적 방어이고 서버 zod .omit() 과 이중 방어다. 서버 계약이 "키 없음 = 변경 없음"(zod partial)일 때만 안전하며, 언마스킹으로 원문을 받아 교체하면 masking={false} 로 되돌린다.',
      file: 'src/client/ui-test/docs/demos/input/masking.tsx',
      Component: InputMaskingDemo,
    },
  ],
  propsTables: [
    {
      title: 'Input',
      rows: definePropRows<InputProps>()([
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          defaultValue: "'edit'",
          description:
            '폼 모드 — 생략하면 감싼 Field/FormMode 를 따르고, 명시하면 폼이 view/disabled 여도 이긴다(단독 상태 유지). 비활성 표기는 이 축 하나다 — disabled boolean prop 은 타입에서 제거됐다.',
        },
        {
          name: 'lock',
          type: 'boolean',
          description:
            '시스템 채움 영구 불변 — readOnly + 자물쇠 아이콘. 모든 mode 를 이긴다(폼이 edit 로 돌아와도 편집 불가). 값은 FormData 에 실린다(전송·복사 O). placeholder 에 "자동 / 저장 시 발급" 형식의 안내를 적는다 — 잠긴 칸에서도 안내문만은 다시 보인다(dl-field-locked-hint). 없으면 개발 경고.',
        },
        {
          name: 'masking',
          type: 'boolean',
          description:
            '서버가 이미 마스킹해 내려준 개인정보 값(a***@b.com)임을 선언한다 — Input·Textarea 전용. 편집 불가 + 마스킹 배색(기울임) + name 미전달: 마스킹된 값이 FormData 에 실려 실값을 파괴하는 사고의 구조적 방어다(서버 zod .omit() 과 이중 방어).',
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
        {
          name: 'clearable',
          type: 'boolean',
          description:
            '값 지우기(×) 버튼 — 제어형 전용(value 필수)이다. Input 은 값을 미러링하지 않아(IME·성능) 비제어에서는 값 유무를 알 수 없다. × 는 onClear 를 부를 뿐 값을 직접 지우지 않는다 — 값의 주인은 호출부다. lock·masking·disabled 칸에는 뜨지 않는다(잠긴 값은 못 지운다).',
        },
        {
          name: 'onClear',
          type: '() => void',
          description: '× 클릭 콜백 — 여기서 값을 비운다. 클릭 후 포커스는 입력으로 복귀한다.',
        },
        {
          name: 'clearLabel',
          type: 'string',
          defaultValue: "'지우기'",
          description: '× 버튼의 접근성 이름. ui 는 사전을 모른다 — 필요하면 번역을 주입한다.',
        },
        {
          name: 'prefix',
          type: 'ReactNode',
          description:
            '앞 어도먼트 — 아이콘·1-2자 글리프 전용 고정폭 슬롯. 긴 텍스트는 앱 조합 몫이다.',
        },
        {
          name: 'suffix',
          type: 'ReactNode',
          description:
            '뒤 어도먼트 — 아이콘·1-2자 단위(₩·kg) 전용. 우측 슬롯 우선순위는 자물쇠 > × > suffix 이고 자물쇠와 × 는 상호 배타라 최대 2슬롯이다.',
        },
        {
          name: 'showCount',
          type: 'boolean',
          description:
            '글자수 카운터(N/max) — 제어형 + maxLength 전용. 컨트롤 아래 우측에 뜨고 편집 가능한 상태에서만 보인다. Textarea 도 같은 계약이다.',
        },
      ]),
    },
    {
      title: 'Textarea',
      rows: definePropRows<TextareaProps>()([
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          defaultValue: "'edit'",
          description: 'Input 과 같은 폼 모드 축. view 는 줄바꿈을 보존한다(whitespace-pre-wrap).',
        },
        {
          name: 'lock',
          type: 'boolean',
          description:
            'Input 과 같은 영구 불변 잠금 — 자물쇠는 여러 줄 컨트롤이라 우상단(첫 줄 옆)에 붙는다.',
        },
        {
          name: 'masking',
          type: 'boolean',
          description: 'Input 과 같은 마스킹 선언 — name 미전달로 전송에서 빠진다.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description: 'Field 밖 단독 사용 시의 오류 배색.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '높이는 내용 기준(min-height 58 고정)이라 size 는 폰트·패딩만 바꾼다.',
        },
        {
          name: 'autosize',
          type: 'boolean',
          description:
            '내용을 따라 높이가 자란다(field-sizing: content) — 상한이 있어 무한히 크지는 않는다. 미지원 브라우저는 선언이 무시되어 현행 고정 높이로 퇴화한다.',
        },
      ]),
    },
  ],
};
