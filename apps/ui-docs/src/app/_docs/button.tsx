import type { ButtonProps, IconButtonProps } from '@hvy/ui';
import { IconButtonDemo } from '../../client/ui-test/docs/demos/button/icon-button';
import { ButtonMatrixDemo } from '../../client/ui-test/docs/demos/button/matrix';
import { ButtonPlaygroundDemo } from '../../client/ui-test/docs/demos/button/playground';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Button, IconButton } from '@hvy/ui';

<Button variant="primary" icon={Save} onClick={save}>저장</Button>
<IconButton tone="danger" icon={Trash2} label="삭제" onClick={remove} />`;

/** Button · IconButton 문서 — variant 5종 × size 5단(테마 스케일 유도). */
export const buttonDoc: DocEntry = {
  slug: 'button',
  category: 'components',
  title: 'Button',
  description:
    '텍스트 버튼과 아이콘 단독 버튼. 삭제(outline-red)를 뺀 전 variant 가 hover 에서 primary 채움 + 흰 글자로 수렴하는 것이 QA 의 핵심 동작이다. 삭제만 예외로 자기 색(짙은 빨강)으로 채워진다 — brand 로 채우면 손을 올리는 순간 위험 신호가 사라지기 때문이다. 비활성 규칙이 갈리기 때문에 IconButton 은 별도 컴포넌트다.',
  usage: USAGE,
  examples: [
    {
      id: 'playground',
      title: 'Button',
      note: 'hover 는 삭제(outline-red)를 뺀 전 variant 가 primary 채움 + 흰 글자로 수렴한다(QA). variant 를 outline-red 로 바꿔 두면 대신 짙은 빨강으로 채워지는 것을 볼 수 있다. 제출 중이라면 disabled 가 아니라 busy 를 쓴다 — disabled 는 title 없이 쓰면 개발 경고가 난다.',
      file: 'src/client/ui-test/docs/demos/button/playground.tsx',
      Component: ButtonPlaygroundDemo,
    },
    {
      id: 'icon-button',
      title: 'IconButton',
      note: '비활성 규칙이 텍스트 버튼과 다르다 — 회색 칩이 아니라 아이콘만 흐려진다. label 은 스크린리더용 필수 prop 이다.',
      file: 'src/client/ui-test/docs/demos/button/icon-button.tsx',
      Component: IconButtonDemo,
    },
    {
      id: 'matrix',
      title: 'variant × size 매트릭스',
      note: 'QA _button.css 전수 조합. 각 버튼에 마우스를 올려 네 열은 primary 채움으로 수렴하는데 삭제(outline-red) 열만 짙은 빨강으로 채워지는 것을, 마지막 행에서 비활성 배색(locked-fg 글자 · outline 보더 · locked-bg 배경)을 확인한다.',
      file: 'src/client/ui-test/docs/demos/button/matrix.tsx',
      Component: ButtonMatrixDemo,
    },
  ],
  propsTables: [
    {
      title: 'Button',
      rows: definePropRows<ButtonProps>()([
        {
          name: 'variant',
          type: "'primary' | 'outline-primary' | 'outline-strong' | 'outline-gray' | 'outline-red'",
          defaultValue: "'outline-gray'",
          description:
            'QA 5종 — primary 채움 + outline 4색. hover 는 삭제(outline-red)를 뺀 전부가 primary 채움으로 수렴하고, 삭제만 자기 색(danger-hover, 짙은 빨강 + 흰 글자)으로 채워진다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description:
            '테마 스케일 유도 5단 — default 높이 32/36/42/46/52(QA 3단 sm·md·xl 보존). 패딩·폰트·아이콘이 함께 변한다.',
        },
        {
          name: 'icon',
          type: 'IconName',
          description: '라벨 왼쪽 아이콘 — 크기는 버튼 size 를 따라간다(md 16 = QA is-16).',
        },
        {
          name: 'busy',
          type: 'boolean',
          description:
            '제출 중처럼 일시적으로 못 누르는 상태. 이유가 자명하므로 title 요구가 없다 — 이유가 화면 밖에 있으면 disabled + title 을 쓴다.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: '비활성. title 로 왜 못 누르는지 적지 않으면 개발 모드에서 경고가 난다.',
        },
      ]),
    },
    {
      title: 'IconButton',
      rows: definePropRows<IconButtonProps>()([
        {
          name: 'icon',
          type: 'IconName',
          required: true,
          description: '표시할 아이콘.',
        },
        {
          name: 'label',
          type: 'string',
          required: true,
          description: '스크린리더용 이름 — 아이콘 단독이라 없으면 빈 버튼으로 읽힌다.',
        },
        {
          name: 'tone',
          type: "'neutral' | 'primary' | 'danger' | 'excel'",
          defaultValue: "'neutral'",
          description:
            '표시 컨트롤은 neutral, 액션은 primary, 삭제는 danger, 엑셀 다운로드는 excel(로고색 고정). danger 만 hover 에서 자기 색(짙은 빨강)으로 채워진다 — outline-red 와 같은 예외다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'sm'",
          description: '버튼 박스 5단(Button.size 와 같은 축) — 기본 sm 이 QA 36×36 이다.',
        },
        {
          name: 'iconSize',
          type: "'sm' | 'md'",
          defaultValue: "'md'",
          description: '글리프 16/20px(QA is-16/is-20) — 박스가 커져도 글리프는 명세를 지킨다.',
        },
      ]),
    },
  ],
};
