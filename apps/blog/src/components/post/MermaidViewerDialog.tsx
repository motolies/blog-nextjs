'use client';

import { Button, buttonVariants, ContentDialog, showToast } from '@hvy/ui';
import { Copy, ExternalLink, Scan, SquareDashed } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '@/lib/clipboard';
import { mermaidEditorHref, pickViewerZoom } from '@/lib/mermaidBlock';
import {
  nextDiagramId,
  renderMermaid,
  svgNaturalSize,
  toMermaidTheme,
} from '@/lib/mermaidRenderer';

type ZoomMode = 'fit' | 'actual';

interface MermaidViewerDialogProps {
  /** 열 다이어그램의 원본 소스. null 이면 닫혀 있다. */
  readonly source: string | null;
  readonly onClose: () => void;
}

/** 화면 맞춤에서 작은 다이어그램이 과하게 부풀지 않도록 원래 크기의 2배까지만 키운다. */
const MAX_FIT_UPSCALE = 2;

/**
 * 본문 다이어그램 크게 보기 — 페이지 안 전체 크기 모달.
 *
 * 본문 SVG 를 복제하지 않고 같은 소스를 새 id 로 다시 그린다. 복제하면 SVG 안의 id(스타일 스코프·
 * 화살표 marker)가 본문 것과 겹쳐 한쪽 화살표가 사라지거나 스타일이 섞인다.
 * 핀치 줌은 브라우저 기본 동작에 맡기고, 정밀한 줌·내보내기는 "새 탭에서 편집"(/util/mermaid)이 맡는다.
 */
export default function MermaidViewerDialog({ source, onClose }: MermaidViewerDialogProps) {
  const { resolvedTheme } = useTheme();
  const [zoom, setZoom] = useState<ZoomMode>('fit');
  // 실패를 소스 단위로 기억한다 — boolean 이면 다음 다이어그램을 열 때 캔버스가 한 박자 늦게 생겨 렌더를 놓친다
  const [failedSource, setFailedSource] = useState<string | null>(null);
  // Radix Portal 은 열린 직후 한 번 더 렌더한 뒤에야 내용을 붙인다. ref 객체는 그 시점을 effect 에
  // 알려 주지 못하므로 콜백 ref 로 받은 노드를 state 로 두고 effect 의존성으로 쓴다.
  const [canvas, setCanvas] = useState<HTMLDivElement | null>(null);
  const zoomRef = useRef<ZoomMode>(zoom);
  zoomRef.current = zoom;
  // 사용자가 배율을 직접 고르기 전까지는 렌더 결과를 보고 첫 배율을 정한다
  const zoomChosenRef = useRef(false);
  const failed = source !== null && failedSource === source;

  // 다른 다이어그램을 열면 배율 선택을 초기화한다
  useEffect(() => {
    if (source === null) return;
    zoomChosenRef.current = false;
    setZoom('fit');
  }, [source]);

  // 렌더 — 소스·테마가 바뀔 때. 이전 SVG 를 먼저 비워 다른 다이어그램이 잠깐 보이지 않게 한다.
  useEffect(() => {
    if (!source || !resolvedTheme || !canvas) return;
    canvas.innerHTML = '';

    let cancelled = false;
    renderMermaid(nextDiagramId(), source, toMermaidTheme(resolvedTheme))
      .then((svg) => {
        if (cancelled || !canvas.isConnected) return;
        canvas.innerHTML = svg;
        const rendered = canvas.querySelector<SVGSVGElement>(':scope > svg');
        let next = zoomRef.current;
        if (!zoomChosenRef.current && rendered) {
          const natural = svgNaturalSize(rendered);
          next = pickViewerZoom(
            canvas.clientWidth,
            canvas.clientHeight,
            natural.width,
            natural.height,
          );
          setZoom(next);
        }
        applyZoom(canvas, next);
      })
      .catch(() => {
        if (!cancelled) setFailedSource(source);
      });

    return () => {
      cancelled = true;
    };
  }, [source, resolvedTheme, canvas]);

  useEffect(() => {
    if (canvas) applyZoom(canvas, zoom);
  }, [zoom, canvas]);

  const chooseZoom = (next: ZoomMode) => {
    zoomChosenRef.current = true;
    setZoom(next);
  };

  const copySource = async () => {
    if (!source) return;
    const copied = await copyToClipboard(source);
    showToast(
      copied ? '다이어그램 소스를 복사했습니다.' : '클립보드에 복사하지 못했습니다.',
      copied ? 'success' : 'error',
    );
  };

  return (
    <ContentDialog
      open={source !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="다이어그램 크게 보기"
      size="full"
      height="full"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <fieldset className="inline-flex gap-1">
          <legend className="sr-only">배율</legend>
          <Button
            size="sm"
            icon={Scan}
            variant={zoom === 'fit' ? 'primary' : 'outline-gray'}
            aria-pressed={zoom === 'fit'}
            onClick={() => chooseZoom('fit')}
          >
            화면 맞춤
          </Button>
          <Button
            size="sm"
            icon={SquareDashed}
            variant={zoom === 'actual' ? 'primary' : 'outline-gray'}
            aria-pressed={zoom === 'actual'}
            onClick={() => chooseZoom('actual')}
          >
            원본 크기
          </Button>
        </fieldset>
        <div className="inline-flex gap-1">
          <Button size="sm" icon={Copy} onClick={copySource}>
            소스 복사
          </Button>
          {source && (
            <a
              className={buttonVariants({ variant: 'outline-gray', size: 'sm' })}
              href={mermaidEditorHref(source)}
              target="_blank"
              rel="noopener"
            >
              <ExternalLink className="size-dl-ctl-ic-sm" aria-hidden="true" />새 탭에서 편집
            </a>
          )}
        </div>
      </div>

      {failed ? (
        <p className="text-dl-fg-muted">다이어그램을 그리지 못했습니다. 문법을 확인해 주세요.</p>
      ) : (
        <div ref={setCanvas} className="mermaid-viewer__canvas" data-zoom={zoom} />
      )}
    </ContentDialog>
  );
}

/**
 * 배율 적용. 맞춤은 viewBox 비율을 유지한 채 가로·세로 모두 화면 안에 들어오게 하고(preserveAspectRatio meet),
 * 원본 크기는 viewBox 크기 그대로 두고 캔버스 스크롤로 이동하게 한다.
 */
function applyZoom(canvas: HTMLElement, zoom: ZoomMode) {
  const svg = canvas.querySelector<SVGSVGElement>(':scope > svg');
  if (!svg) return;
  const { width, height } = svgNaturalSize(svg);

  if (zoom === 'fit') {
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.maxWidth = `${width * MAX_FIT_UPSCALE}px`;
    svg.style.maxHeight = `${height * MAX_FIT_UPSCALE}px`;
  } else {
    svg.style.width = `${width}px`;
    svg.style.height = `${height}px`;
    svg.style.maxWidth = 'none';
    svg.style.maxHeight = 'none';
  }
}
