import type { RunModule } from '@/types/quant';

export function cancelMessage(module: RunModule, runId: number | string): string {
  const boundary = module === 'STOCK' ? '다음 종목·단계 경계' : '다음 단계·IC 청크 경계';
  return `run #${runId} 정지를 요청합니다. ${boundary}에서 멈춥니다. 이미 저장된 데이터는 유지되며 진행 중인 API·SQL을 즉시 강제 종료하지 않습니다.`;
}
