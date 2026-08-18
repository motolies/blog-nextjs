'use client';

import { Icon } from '@hvy/ui';
import {
  Banknote,
  Box,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Columns3,
  FileSpreadsheet,
  Flag,
  Globe,
  Hash,
  Lock,
  type LucideIcon,
  MapPin,
  Menu,
  Package,
  Phone,
  Plus,
  Printer,
  Save,
  Search,
  Ship,
  StickyNote,
  Trash2,
  TriangleAlert,
  Truck,
  UserCheck,
  Warehouse,
  X,
} from 'lucide-react';

/**
 * 사용 예 — 대표 lucide 아이콘을 <Icon icon> 으로 그린다.
 * 문자열 레지스트리가 없으므로(트리셰이킹 유지) 데모도 명시 import 로 나열한다.
 * 전체 목록은 https://lucide.dev 검색이 정본이다.
 */
const SAMPLES: ReadonlyArray<readonly [string, LucideIcon]> = [
  ['Search', Search],
  ['Save', Save],
  ['Trash2', Trash2],
  ['Plus', Plus],
  ['Check', Check],
  ['X', X],
  ['ChevronDown', ChevronDown],
  ['ChevronLeft', ChevronLeft],
  ['ChevronRight', ChevronRight],
  ['Calendar', Calendar],
  ['Lock', Lock],
  ['Menu', Menu],
  ['Columns3', Columns3],
  ['CircleCheck', CircleCheck],
  ['CircleAlert', CircleAlert],
  ['CircleHelp', CircleHelp],
  ['TriangleAlert', TriangleAlert],
  ['FileSpreadsheet', FileSpreadsheet],
  ['Printer', Printer],
  ['StickyNote', StickyNote],
  ['Truck', Truck],
  ['Ship', Ship],
  ['Warehouse', Warehouse],
  ['Package', Package],
  ['Box', Box],
  ['UserCheck', UserCheck],
  ['Phone', Phone],
  ['MapPin', MapPin],
  ['Globe', Globe],
  ['Banknote', Banknote],
  ['Hash', Hash],
  ['Flag', Flag],
];

export function IconsAllDemo() {
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-dl-sm text-dl-fg-muted">대표 {SAMPLES.length}종 (lucide-react)</p>
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
        {SAMPLES.map(([name, icon]) => (
          <div
            key={name}
            className="flex flex-col items-center gap-1.5 rounded-dl-control border border-dl-divider px-2 py-3 text-dl-icon hover:text-dl-primary"
          >
            <Icon icon={icon} size="md" />
            <code className="max-w-full truncate font-dl-mono text-[10px] text-dl-fg-muted">
              {name}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}
