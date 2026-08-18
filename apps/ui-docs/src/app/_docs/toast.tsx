import { ToastTonesDemo } from '../../client/ui-test/docs/demos/toast/tones';
import type { DocEntry } from './types';

const USAGE = `import { showToast } from '@hvy/ui';   // ToastViewport 가 마운트된 전제

showToast('저장되었습니다');                            // 기본 tone: success
showToast('12건 중 10건만 저장되었습니다', 'warning');   // 누락은 반드시 숫자로
showToast('본문', 'error', { title: '제목 (선택)' });`;

/** Toast 문서 — 완료 안내 전용, 3초 자동 소멸. */
export const toastDoc: DocEntry = {
  slug: 'toast',
  category: 'components',
  title: 'Toast',
  description:
    '완료 안내 전용 — 딤도 버튼도 없고 3초 뒤 사라진다(이 시간이 유일한 출구). 진행을 막아야 하면 확인 모달을 쓴다. 콘텐츠 영역 좌측 하단 320px 고정 폭(QA). showToast 는 이벤트 핸들러·effect 에서만 호출한다 — 렌더 중 호출하면 서버에서 모듈 상태가 요청 간에 공유된다.',
  usage: USAGE,
  examples: [
    {
      id: 'tones',
      title: '4톤 · 타이틀 · 중첩',
      note: 'success(의도대로 완료) · warning(일부 누락 — 건수를 숫자로) · error(전부 실패, 재시도 가능한 것만) · info(상태 변화·진행 중). 타이틀은 선택 — 1줄 권장, 본문은 명사형 권장.',
      file: 'src/client/ui-test/docs/demos/toast/tones.tsx',
      Component: ToastTonesDemo,
    },
  ],
  propsTables: [
    {
      title: 'showToast(message, tone?, options?)',
      rows: [
        {
          name: 'message',
          type: 'string',
          required: true,
          description: '이미 번역된 문자열 — ui 는 사전을 모른다.',
        },
        {
          name: 'tone',
          type: "'success' | 'warning' | 'error' | 'info'",
          defaultValue: "'success'",
          description: '완료 국면별 배색·아이콘.',
        },
        {
          name: 'options.title',
          type: 'string',
          description: '선택 타이틀 — 1줄 권장.',
        },
      ],
    },
  ],
};
