'use client';

import {
  Badge,
  Button,
  ContentDialog,
  ErrorState,
  InlineNotice,
  showToast,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@hvy/ui';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { RunActions } from '@/components/quant/useRunActions';
import { quantKeys } from '@/hooks/useQuant';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import service from '@/service';
import { AdviceChecksPanel } from './AdviceChecksPanel';
import { AdvicePicksPanel } from './AdvicePicksPanel';
import { AdvicePromptPanel } from './AdvicePromptPanel';
import { AdviceScoresPanel } from './AdviceScoresPanel';
import { AdviceSummaryPanel } from './AdviceSummaryPanel';
import { variantLabel, variantTone } from './advisorLabels';
import { useAdvice } from './advisorQueries';

/** 서브탭 — controlled `Tabs`(URL 은 `?advice=` 만 갖고 서브탭은 다이얼로그 지역 상태). */
const SUB_TABS = ['summary', 'picks', 'scores', 'checks', 'prompt'] as const;
type SubTab = (typeof SUB_TABS)[number];

/** 액션이 있는 토스트는 누를 시간이 필요하다(useRunActions 와 같은 8초). */
const ACTION_TOAST_MS = 8_000;

/** 삭제 인라인 확인 문구 — PLAN confirm 매트릭스 "판단 삭제" 행 원문. CASCADE 범위·복구 불가·IC 미삭제→IC_BACKFILL. */
const DELETE_MESSAGE =
  '후보·픽·채점·장중/아침 점검이 CASCADE 로 지워지고 복구할 수 없습니다. 프롬프트 원문(run 기준)은 남습니다. 시그널 IC(signal_ic_daily)는 지워지지 않아 재판단 뒤 IC_BACKFILL 이 필요합니다.';

/**
 * 판단 상세 — `ContentDialog size="xl" height="tall"`. 열림 상태는 URL(`?advice=`)이 진실이고 `adviceId` 로 스스로 조회한다.
 *
 * 본문: **액션 바**([판단 삭제]) → 서브탭(요약·픽·채점·점검·프롬프트 원문). **푸터는 닫기 1개**(DialogFooter 폭 220 고정).
 * 삭제는 되돌릴 수 없는 유일한 파괴 조작이라 **다이얼로그 안 `useConfirm` 대신 인라인 확인**(`InlineNotice tone="error"` +
 * [삭제 Danger][취소]) 으로 묻는다 — 모달 위 모달 금지(`useTrackOpen` 경고).
 * 성공 시 닫고 "판단 #N 삭제" 토스트 + '지금 재판단'(`triggerAdvisor('ADVISE', baseDate)`) → 그리드 `onDeleted` + `quantKeys.all` 무효화.
 */
export function AdviceDetailDialog({
  adviceId,
  onClose,
  onDeleted,
  actions,
}: {
  /** null 이면 닫힘. */
  adviceId: string | null;
  onClose: () => void;
  /** 삭제 성공 뒤 — 그리드가 `refresh()` 를 넘긴다(useServerGrid 는 react-query 밖이라 invalidate 로는 안 갱신된다). */
  onDeleted: () => void;
  actions: RunActions;
}) {
  const open = adviceId !== null;
  const query = useAdvice(adviceId);
  const queryClient = useQueryClient();
  const [sub, setSub] = useState<SubTab>('summary');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 판단이 바뀌면 이전 판단의 서브탭·확인 상태를 끌고 가지 않는다.
  useEffect(() => {
    setSub('summary');
    setConfirming(false);
  }, [adviceId]);

  const detail = query.data;
  const header = detail?.header;

  /** 삭제 실행 — 성공하면 닫고 토스트('지금 재판단'은 그 판단의 baseDate 로 ADVISE 재실행). */
  const executeDelete = async () => {
    if (!header) return;
    const { adviceId: id, baseDate } = header;
    setDeleting(true);
    try {
      await service.advisor.deleteAdvice(id);
      onClose();
      showToast(`판단 #${id} 삭제`, 'success', {
        action: { label: '지금 재판단', onClick: () => actions.triggerAdvisor('ADVISE', baseDate) },
        durationMs: ACTION_TOAST_MS,
      });
      queryClient.invalidateQueries({ queryKey: quantKeys.all });
      onDeleted();
    } catch (error) {
      showApiErrorToast(`판단 #${id} 삭제에 실패했습니다.`, error);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <ContentDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={
        header ? (
          <span className="flex items-center gap-2">
            판단 #{header.adviceId} · {header.baseDate}
            <Badge tone={variantTone(header.variant)} size="sm">
              {variantLabel(header.variant)}
            </Badge>
          </span>
        ) : (
          `판단 #${adviceId ?? ''}`
        )
      }
      description={
        header
          ? `${header.model ?? '규칙 기반'} · ${header.promptVersion ?? '—'} · run #${header.runId}`
          : undefined
      }
      size="xl"
      height="tall"
      footer={
        <Button variant="outline-gray" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {query.isPending ? (
        <div className="flex flex-col gap-2 p-2">
          <span className="block h-4 w-1/3 animate-pulse rounded-dl-badge bg-dl-option-hover motion-reduce:animate-none" />
          <span className="block h-40 w-full animate-pulse rounded-dl-container bg-dl-option-hover motion-reduce:animate-none" />
        </div>
      ) : query.isError || !detail || !header ? (
        <ErrorState
          message="판단을 불러오지 못했습니다 — 삭제된 판단이거나 advisor 가 비활성입니다."
          onRetry={query.refetch}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-1">
          {/* ── 액션 바 / 인라인 확인 ── */}
          {confirming ? (
            <InlineNotice
              tone="error"
              title={`판단 #${header.adviceId} 삭제 확인`}
              action={
                <span className="flex flex-wrap gap-1">
                  <Button size="xs" variant="outline-red" busy={deleting} onClick={executeDelete}>
                    삭제
                  </Button>
                  <Button
                    size="xs"
                    variant="outline-gray"
                    disabled={deleting}
                    onClick={() => setConfirming(false)}
                  >
                    취소
                  </Button>
                </span>
              }
            >
              <span className="wrap-anywhere">{DELETE_MESSAGE}</span>
            </InlineNotice>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline-red"
                icon={Trash2}
                onClick={() => setConfirming(true)}
              >
                판단 삭제
              </Button>
              <span className="text-dl-xs text-dl-fg-muted">
                재판단 전용 — 삭제 뒤 같은 기준일로 ADVISE 를 다시 돌립니다
              </span>
            </div>
          )}

          {/* ── 서브탭 ── */}
          <Tabs
            value={sub}
            onValueChange={(value) => setSub(value as SubTab)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabList label="판단 상세 탭" size="sm" className="shrink-0 overflow-x-auto">
              <Tab value="summary">요약</Tab>
              <Tab value="picks" badge={detail.picks.length}>
                픽
              </Tab>
              <Tab value="scores" badge={detail.candidateScores.length + detail.callScores.length}>
                채점
              </Tab>
              <Tab
                value="checks"
                badge={detail.intradayChecks.length + (detail.morningCheck ? 1 : 0)}
              >
                점검
              </Tab>
              <Tab value="prompt">프롬프트 원문</Tab>
            </TabList>
            <TabPanel value="summary" className="pt-3">
              <AdviceSummaryPanel header={header} />
            </TabPanel>
            <TabPanel value="picks" className="pt-3">
              <AdvicePicksPanel picks={detail.picks} candidates={detail.candidates} />
            </TabPanel>
            <TabPanel value="scores" className="pt-3">
              <AdviceScoresPanel
                candidateScores={detail.candidateScores}
                callScores={detail.callScores}
              />
            </TabPanel>
            <TabPanel value="checks" className="pt-3">
              <AdviceChecksPanel
                intradayChecks={detail.intradayChecks}
                morningCheck={detail.morningCheck}
              />
            </TabPanel>
            <TabPanel value="prompt" className="pt-3">
              {/* Radix 는 비활성 패널을 마운트하지 않지만, enabled 도 함께 걸어 이중으로 lazy 를 보장한다 */}
              <AdvicePromptPanel adviceId={String(header.adviceId)} enabled={sub === 'prompt'} />
            </TabPanel>
          </Tabs>
        </div>
      )}
    </ContentDialog>
  );
}
