import { ToastActionDemo } from '../../client/ui-test/docs/demos/toast/action';
import { ToastTonesDemo } from '../../client/ui-test/docs/demos/toast/tones';
import type { DocEntry } from './types';

const USAGE = `import { showToast } from '@hvy/ui';   // ToastViewport 가 마운트된 전제

showToast('저장되었습니다');                            // 기본 tone: success
showToast('12건 중 10건만 저장되었습니다', 'warning');   // 누락은 반드시 숫자로
showToast('본문', 'error', { title: '제목 (선택)' });
showToast('보류 처리되었습니다', 'info', {              // 액션 — 되돌릴 수 있는 결과에만
  durationMs: 8000,
  action: { label: '실행 취소', onClick: undo },
});`;

/** Toast 문서 — 완료 안내 전용, 기본 3초 자동 소멸. */
/**
 * 이 문서의 props 표만 `definePropRows` 가드를 쓰지 않는다.
 *
 * 행이 컴포넌트 prop 이 아니라 **함수 인자**이고(`showToast(message, tone, options)`),
 * `options.title` 처럼 점 표기 경로가 섞인다 — `keyof P & string` 으로는 표현할 수 없다.
 * 표를 인자별로 쪼개면 가드는 걸리지만 "한 함수의 시그니처"라는 사실이 흩어진다.
 * 대신 `showToast` 의 시그니처가 바뀌면 아래 usage 코드블록이 먼저 어긋나 보인다.
 */
export const toastDoc: DocEntry = {
  slug: 'toast',
  category: 'components',
  title: 'Toast',
  description:
    '완료 안내 전용 — 딤 없이 기본 3초 뒤 사라진다. 진행을 막아야 하면 확인 모달을 쓴다. 콘텐츠 영역 좌측 하단 320px 고정 폭(QA). showToast 는 이벤트 핸들러·effect 에서만 호출한다 — 렌더 중 호출하면 서버에서 모듈 상태가 요청 간에 공유된다. action 을 주면 박스가 단일 버튼이 아니라 액션·닫기 버튼을 가진 형태가 되고, durationMs 로 누를 시간을 벌린다.',
  usage: USAGE,
  examples: [
    {
      id: 'tones',
      title: '4톤 · 타이틀 · 중첩',
      note: 'success(의도대로 완료) · warning(일부 누락 — 건수를 숫자로) · error(전부 실패, 재시도 가능한 것만) · info(상태 변화·진행 중). 타이틀은 선택 — 1줄 권장, 본문은 명사형 권장.',
      file: 'src/client/ui-test/docs/demos/toast/tones.tsx',
      Component: ToastTonesDemo,
    },
    {
      id: 'action',
      title: '액션 · durationMs',
      note: '액션이 없으면 기존 그대로(아무 데나 눌러 닫는 단일 버튼 — QA 규격) — 액션이 있을 때만 액션·닫기 버튼이 각자 버튼이 된다(중첩 버튼 회피). 액션은 "되돌릴 수 있는 결과"에만 쓴다(v3 완료 안내 원칙의 연장). durationMs 가 유한하지 않으면(∞) 자동 소멸을 예약하지 않는다 — setTimeout 은 Infinity 를 0 으로 강제하기 때문에 가드가 필요했다.',
      file: 'src/client/ui-test/docs/demos/toast/action.tsx',
      Component: ToastActionDemo,
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
        {
          name: 'options.action',
          type: '{ label; onClick }',
          description:
            '토스트 안의 단일 액션("실행 취소"류) — 누르면 실행 후 닫힌다. 되돌릴 수 있는 결과에만 쓴다.',
        },
        {
          name: 'options.durationMs',
          type: 'number',
          defaultValue: '3000',
          description:
            '자동 닫힘까지(ms). Infinity 면 수동 닫기 전용 — 자동 소멸을 예약하지 않는다.',
        },
      ],
    },
  ],
};
