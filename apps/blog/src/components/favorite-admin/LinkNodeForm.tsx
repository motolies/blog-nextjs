'use client';

import { Button, Icon, Input, Label, Switch } from '@hvy/ui';
import { ImagePlus } from 'lucide-react';
import type React from 'react';
import { useId, useState } from 'react';
import { resolveLinkIcon } from '@/lib/linkIcons';
import IconPickerDialog from './IconPickerDialog';

/** 그룹/링크 편집 폼의 값. 그룹은 url 을, 링크는 description 을 쓰지 않는다. */
export interface LinkNodeFormData {
  name: string;
  url: string;
  icon: string;
  description: string;
  isActive: boolean;
}

export const EMPTY_FORM: LinkNodeFormData = {
  name: '',
  url: '',
  icon: '',
  description: '',
  isActive: true,
};

/**
 * 그룹과 링크가 공유하는 편집 폼. `kind` 로 필드 구성만 갈린다.
 *
 * `code` 는 묻지 않는다 — 이름에서 자동 생성하고(buildNodeCode), 수정 시에는 읽기 전용으로만
 * 보여준다. 사용자가 코드를 직접 정하면 형제와 겹칠 수 있는데, 백엔드의 중복 검사는
 * IllegalArgumentException → 500 + Slack 알림이라 평범한 실수가 장애 알림이 되어버린다.
 */
export default function LinkNodeForm({
  kind,
  data,
  existingCode,
  onChange,
}: {
  readonly kind: 'group' | 'link';
  readonly data: LinkNodeFormData;
  /** 수정 모드일 때만 값이 있다. 신규는 저장 시점에 이름에서 만든다. */
  readonly existingCode?: string;
  readonly onChange: (next: LinkNodeFormData) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const nameId = useId();
  const urlId = useId();
  const descId = useId();
  const iconBtnId = useId();
  const SelectedIcon = resolveLinkIcon(data.icon);

  const set = <K extends keyof LinkNodeFormData>(key: K, value: LinkNodeFormData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor={nameId}>{kind === 'group' ? '그룹 이름' : '링크 이름'} *</Label>
        <Input
          id={nameId}
          value={data.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('name', e.target.value)}
          placeholder={kind === 'group' ? '예: 관측' : '예: Grafana'}
        />
      </div>

      {kind === 'link' && (
        <div className="space-y-1.5">
          <Label htmlFor={urlId}>URL *</Label>
          <Input
            id={urlId}
            value={data.url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('url', e.target.value)}
            placeholder="https://grafana.example.internal"
          />
        </div>
      )}

      {kind === 'group' && (
        <div className="space-y-1.5">
          <Label htmlFor={descId}>설명</Label>
          <Input
            id={descId}
            value={data.description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              set('description', e.target.value)
            }
            placeholder="선택 입력"
          />
        </div>
      )}

      <div className="space-y-1.5">
        {/* button 은 labelable 요소라 htmlFor 로 연결된다 — Label 은 htmlFor 가 필수다. */}
        <Label htmlFor={iconBtnId}>아이콘</Label>
        <div className="flex items-center gap-2">
          <Button
            id={iconBtnId}
            variant="outline-gray"
            icon={ImagePlus}
            onClick={() => setPickerOpen(true)}
          >
            {data.icon || '아이콘 선택'}
          </Button>
          {SelectedIcon && (
            <span className="flex size-dl-ic-lock items-center justify-center rounded-dl-control border border-dl-border">
              <Icon icon={SelectedIcon} size="md" />
            </span>
          )}
        </div>
      </div>

      <Switch
        label="사용"
        checked={data.isActive}
        onCheckedChange={(checked) => set('isActive', checked)}
      />

      {existingCode && (
        // 코드는 편집 대상이 아니다. 범용 /admin/master-code 화면과 대조할 때만 필요해 보여만 준다.
        <p className="text-dl-xs text-dl-fg-muted">코드: {existingCode}</p>
      )}

      <IconPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={data.icon}
        onSelect={(icon) => set('icon', icon)}
      />
    </div>
  );
}
