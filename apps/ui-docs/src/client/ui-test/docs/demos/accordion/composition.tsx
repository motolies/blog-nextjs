'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Icon } from '@hvy/ui';
import { FileText, Tag, TriangleAlert } from 'lucide-react';

/**
 * 트리거 자유 조합 — **4파트 API 를 유지하는 근거가 이 예제 자체다.**
 *
 * options 배열 API(`items={[{ title, body }]}`)로 굳혔다면 아래 조합이 전부 불가능하다.
 * 트리거 안에 아이콘·배지·건수를 넣는 것은 화면마다 다르고, 그 다름을 컴포넌트가
 * 예측해 prop 으로 열어 주는 쪽은 항상 진다.
 *
 * 검증 포인트:
 * · 트리거 안에 무엇을 넣든 우측 화살표는 **항상 오른쪽 끝**에 남는다(justify-between)
 * · 화살표를 사용처가 직접 그리지 않는다 — 그러면 회전 규칙이 화면마다 갈라진다
 * · 제목이 길어도 화살표를 밀어내지 않는다(가운데 항목에서 확인)
 * · 본문에 표·폼 같은 블록을 넣어도 열림 애니메이션이 깨지지 않는다
 */
export function AccordionCompositionDemo() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-xl">
      <AccordionItem value="tags">
        <AccordionTrigger>
          <span className="flex min-w-0 items-center gap-2">
            <Icon icon={Tag} size="sm" className="shrink-0 text-dl-icon" />
            <span className="truncate">태그</span>
            <Badge tone="neutral" size="xs">
              12
            </Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-wrap gap-1.5">
            {['React', 'Next.js', '접근성', '성능', '회고'].map((tag) => (
              <Badge key={tag} tone="primary" size="xs">
                {tag}
              </Badge>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="long">
        <AccordionTrigger>
          <span className="flex min-w-0 items-center gap-2">
            <Icon icon={FileText} size="sm" className="shrink-0 text-dl-icon" />
            <span className="truncate">
              제목이 아주 길어서 한 줄에 다 들어가지 않는 항목 — 말줄임이 걸리고 화살표는 밀리지
              않는다
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          트리거의 자식이 `min-w-0` 을 갖지 않으면 flex 아이템의 자동 최소 폭이 내용 폭이라 화살표가
          상자 밖으로 밀려난다.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="warn">
        <AccordionTrigger>
          <span className="flex min-w-0 items-center gap-2">
            <Icon icon={TriangleAlert} size="sm" className="shrink-0 text-dl-warning" />
            <span className="truncate">색인 실패</span>
            <Badge tone="danger" size="xs">
              4
            </Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          {/* 본문에 블록 요소를 넣어도 높이 애니메이션이 성립한다 */}
          <table className="w-full text-dl-xs">
            <thead>
              <tr className="border-dl-divider border-b text-dl-fg-muted">
                <th className="py-1 text-left font-medium">게시글 ID</th>
                <th className="py-1 text-left font-medium">사유</th>
              </tr>
            </thead>
            <tbody className="text-dl-fg">
              <tr>
                <td className="py-1 font-dl-mono">POST-100014</td>
                <td className="py-1">본문 길이 초과</td>
              </tr>
              <tr>
                <td className="py-1 font-dl-mono">POST-100027</td>
                <td className="py-1">카테고리 미지정</td>
              </tr>
            </tbody>
          </table>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
