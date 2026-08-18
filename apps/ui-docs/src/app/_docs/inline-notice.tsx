import type { InlineNoticeProps } from '@hvy/ui';
import { InlineNoticeTonesDemo } from '../../client/ui-test/docs/demos/inline-notice/tones';
import { InlineNoticeActionDemo } from '../../client/ui-test/docs/demos/inline-notice/with-action';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { InlineNotice } from '@hvy/ui';

<InlineNotice tone="warning" title="마스킹된 값이 있습니다">
  마스킹된 칸은 저장 시 제외됩니다.
</InlineNotice>`;

/** InlineNotice 문서 — 화면에 머무는 안내 배너. */
export const inlineNoticeDoc: DocEntry = {
  slug: 'inline-notice',
  category: 'components',
  title: 'InlineNotice',
  description:
    '화면에 머무는 안내 배너 — 토스트(3초 휘발)와 ErrorState(영역 전면 대체) 사이의 층이다. 마스킹 안내처럼 화면에 체류하는 내내 보여야 하는 문맥 설명이 주 용도. 틴트 배경 + 잉크 글자(Badge 와 같은 문법 — 500 계열은 틴트 위에서 WCAG AA 미달), 아이콘은 토스트 세트를 재사용한다. 상호작용은 action 슬롯으로 앱이 넣는다 — 순수 표시라 RSC 에서도 쓴다.',
  usage: USAGE,
  examples: [
    {
      id: 'tones',
      title: '톤 5종',
      note: 'muted 는 아이콘 없는 조용한 부가 설명(마스킹 안내 등). 의미 톤 4종은 토스트와 같은 아이콘 — info 는 QA 에 전용 글리프가 없어 warning 글리프를 info 색으로 쓴다(toast 선례).',
      file: 'src/client/ui-test/docs/demos/inline-notice/tones.tsx',
      Component: InlineNoticeTonesDemo,
    },
    {
      id: 'with-action',
      title: 'title · action · live',
      note: '렌더 후 동적으로 삽입되는 배너만 live 를 켠다 — role="status" 로 스크린리더가 등장을 읽는다. 처음부터 있는 배너에 켜면 소음이다.',
      file: 'src/client/ui-test/docs/demos/inline-notice/with-action.tsx',
      Component: InlineNoticeActionDemo,
    },
  ],
  propsTables: [
    {
      title: 'InlineNotice',
      rows: definePropRows<InlineNoticeProps>()([
        {
          name: 'tone',
          type: "'muted' | 'info' | 'success' | 'warning' | 'error'",
          defaultValue: "'muted'",
          description: 'muted 는 아이콘 없는 중립 배색, 나머지는 의미색 틴트 + 잉크 글자.',
        },
        {
          name: 'title',
          type: 'string',
          description: '본문 위 한 줄 굵은 제목(선택).',
        },
        {
          name: 'children',
          type: 'ReactNode',
          required: true,
          description: '본문 — 이미 번역된 문자열. ui 는 사전을 모른다.',
        },
        {
          name: 'action',
          type: 'ReactNode',
          description: '우측 액션 슬롯 — 언마스킹 링크·닫기 버튼 등 상호작용은 앱이 넣는다.',
        },
        {
          name: 'live',
          type: 'boolean',
          description:
            '동적으로 삽입되는 배너만 켠다 — role="status" 부여. 처음부터 있는 배너에는 켜지 않는다.',
        },
        {
          name: 'className',
          type: 'string',
          description: '루트에 병합되는 클래스.',
        },
      ]),
    },
  ],
};
