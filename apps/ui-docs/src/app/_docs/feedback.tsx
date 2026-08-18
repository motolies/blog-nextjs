import type { EmptyState, ErrorState, Spinner } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { FeedbackStatesDemo } from '../../client/ui-test/docs/demos/feedback/states';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { EmptyState, ErrorState, Spinner } from '@hvy/ui';

{isLoading ? <Spinner /> : null}
{isEmpty ? <EmptyState message="조회 결과가 없습니다" hint="검색 조건을 바꿔 보세요" /> : null}
{isError ? <ErrorState message="조회에 실패했습니다" onRetry={refetch} /> : null}`;

/** 상태 표시 3종 문서 — Spinner · EmptyState · ErrorState. */
export const feedbackDoc: DocEntry = {
  slug: 'feedback',
  category: 'components',
  title: 'Feedback',
  description:
    '조회 결과 영역의 상태 표시 3종. 빈 상태는 "결과 없음"과 "아직 검색 안 함"을 구분해 보여준다 — 같은 화면으로 두면 사용자가 검색이 안 된 것을 결과 없음으로 오해한다.',
  usage: USAGE,
  examples: [
    {
      id: 'states',
      title: 'Spinner · EmptyState · ErrorState',
      note: 'ErrorState 의 재시도는 클릭 핸들러라 클라이언트 전용이다.',
      file: 'src/client/ui-test/docs/demos/feedback/states.tsx',
      Component: FeedbackStatesDemo,
    },
  ],
  propsTables: [
    {
      title: 'EmptyState',
      rows: definePropRows<ComponentProps<typeof EmptyState>>()([
        {
          name: 'message',
          type: 'ReactNode',
          required: true,
          description: '주 문구.',
        },
        {
          name: 'hint',
          type: 'ReactNode',
          description: '다음 행동 안내.',
        },
      ]),
    },
    {
      title: 'ErrorState',
      rows: definePropRows<ComponentProps<typeof ErrorState>>()([
        {
          name: 'message',
          type: 'ReactNode',
          required: true,
          description: '오류 문구.',
        },
        {
          name: 'onRetry',
          type: '() => void',
          description: '있으면 재시도 버튼이 붙는다.',
        },
      ]),
    },
    {
      title: 'Spinner',
      rows: definePropRows<ComponentProps<typeof Spinner>>()([
        {
          name: 'className',
          type: 'string',
          description: '크기·배치 조정용.',
        },
      ]),
    },
  ],
};
