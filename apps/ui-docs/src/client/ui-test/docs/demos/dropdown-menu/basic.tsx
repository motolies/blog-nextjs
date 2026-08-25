'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  showToast,
} from '@hvy/ui';
import { FileText, Menu, Printer, Save, Trash2 } from 'lucide-react';

/**
 * 기본 — 트리거는 기존 버튼 규격(Button·IconButton)을 그대로 쓴다(asChild 고정,
 * 새 버튼 모양을 만들지 않는다). 화살표 이동·typeahead·Esc 닫기는 radix 몫.
 * 파괴적 액션은 destructive 로 빨간 신호를 유지하고 Separator 로 가른다.
 */
export function DropdownMenuBasicDemo() {
  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button size="sm" variant="outline-strong">
            행 액션
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem icon={FileText} onSelect={() => showToast('상세 보기 (데모)', 'info')}>
            상세 보기
          </DropdownMenuItem>
          <DropdownMenuItem
            icon={Printer}
            onSelect={() => showToast('인쇄 미리보기 (데모)', 'info')}
          >
            인쇄 미리보기
          </DropdownMenuItem>
          <DropdownMenuItem icon={Save} disabled onSelect={() => {}}>
            저장 (비활성)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            icon={Trash2}
            destructive
            onSelect={() => showToast('삭제 (데모)', 'error')}
          >
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <IconButton icon={Menu} label="더 보기" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => showToast('엑셀 다운로드 (데모)', 'info')}>
            엑셀 다운로드
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => showToast('인쇄 (데모)', 'info')}>
            인쇄
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
