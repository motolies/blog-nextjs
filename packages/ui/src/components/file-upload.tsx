'use client';

import { Lock, X } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { Button } from './button';
import { FieldViewText, useFieldControl } from './field';
import { isAcceptedFile, isAcceptedFileSize } from './fileValidation';
import type { FieldMode } from './form-mode';

/**
 * 파일 업로드 — **단일 파일 + 확장자 제한** 전용.
 *
 * 파일명 표시 박스(`dl-field`) + [파일 선택] 버튼 + 숨긴 네이티브 `<input type="file">`.
 * 진짜 컨트롤은 네이티브 input 이다(Checkbox 의 "네이티브 살려두기" 패턴) — 파일 대화상자·
 * 키보드·폼 전송은 전부 네이티브 동작이고, 시각만 박스와 버튼이 맡는다.
 *
 * 검증의 단일 진실 소스는 `accept` 다 — 같은 문자열이 대화상자 필터(네이티브)와
 * 선택 결과 재검증(`fileValidation.ts`) 양쪽에 쓰인다. 위반 파일은 값으로 받지 않고
 * (이전 값 유지) 내부 invalid 를 켠 뒤 `onReject` 로 알린다.
 *
 * ⚠️ 프로그램으로 주입한 `value`(File)는 네이티브 input 에 되돌려 넣지 않으므로
 * FormData 에 실리지 않는다 — 사용자가 대화상자로 고른 파일만 실린다.
 * 실전 업로드는 fetch/BFF 경로(multipart)가 정석이고 `name` 은 그 보조다.
 */

/** 거부 사유 — 확장자(accept) 또는 크기(maxSize). 문구 선택의 분기 키다. */
export type FileRejectReason = 'extension' | 'size';

export type FileUploadProps = {
  /** 주면 controlled. 생략하면 `defaultValue` 로 시작하는 내부 상태가 된다. */
  readonly value?: File | null;
  readonly defaultValue?: File | null;
  readonly onValueChange?: (file: File | null) => void;
  /** 있으면 숨긴 네이티브 input 이 든다 — 사용자가 고른 파일만 FormData 에 실린다. */
  readonly name?: string;
  /** 확장자 제한 — `.pdf,.xlsx` 형식. 대화상자 필터와 선택 재검증이 이 한 값을 쓴다. */
  readonly accept?: string;
  /** 크기 상한(바이트, 포함) — 대화상자가 걸러 주지 않는 축이라 선택 시 검증한다. */
  readonly maxSize?: number;
  /** 검증 위반으로 값이 거부됐을 때. 안내 문구는 앱이 띄운다 — `ui` 는 사전을 모른다. */
  readonly onReject?: (file: File, reason: FileRejectReason) => void;
  /** 서버에 이미 있는 파일의 이름 — 값이 비어 있을 때 대신 표시한다(교체 전 상태). */
  readonly fileName?: string;
  /** [파일 선택] 버튼 문구. `ui` 는 사전을 모른다 — 필수다. */
  readonly buttonLabel: string;
  readonly placeholder?: string;
  /** × 버튼의 접근성 이름 — 고른 파일만 지운다(서버 파일 삭제는 앱의 몫). */
  readonly clearLabel?: string;
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  /** 시스템 채움 영구 불변 — 선택·지우기 버튼을 감추고 자물쇠를 단다. */
  readonly lock?: boolean;
  readonly invalid?: boolean;
  /** 5단 사이즈 — 박스와 버튼이 같은 단계로 움직인다. */
  readonly size?: ControlSize;
  readonly id?: string;
  readonly className?: string;
};

export function FileUpload({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  name,
  accept,
  maxSize,
  onReject,
  fileName,
  buttonLabel,
  placeholder,
  clearLabel = '파일 지우기',
  mode,
  lock,
  invalid,
  size,
  id,
  className,
}: FileUploadProps) {
  const field = useFieldControl({ id, invalid, size, mode, lock });
  const [value, setValue] = useControllableState<File | null>(
    valueProp,
    defaultValue,
    onValueChange,
  );
  /** 확장자 위반 상태 — 다음 유효한 선택에서 풀린다. Field 의 invalid 와 OR 로 합쳐진다. */
  const [rejected, setRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = value?.name ?? fileName ?? '';

  if (field.state.view) {
    // 파일명이 곧 표시값이다. 빈값이면 빈칸(placeholder 금지 — 빈칸 규칙).
    return <FieldViewText size={field.size}>{displayName || null}</FieldViewText>;
  }

  const showInvalid = rejected || field.invalid;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 대화상자 취소 — 브라우저가 목록을 비워도 이전 값 표시는 유지한다.
    if (!file) return;
    // 확장자 먼저 — 종류가 틀린 파일에 크기 안내를 하면 엉뚱한 문구가 된다.
    const reason: FileRejectReason | null = !isAcceptedFile(accept, file.name)
      ? 'extension'
      : !isAcceptedFileSize(maxSize, file.size)
        ? 'size'
        : null;
    if (reason) {
      // 위반 파일은 값으로 받지 않는다 — 네이티브 input 도 비워 FormData 유출을 막는다.
      event.target.value = '';
      setRejected(true);
      onReject?.(file, reason);
      return;
    }
    setRejected(false);
    setValue(file);
    field.notifyDirty();
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = '';
    setRejected(false);
    setValue(null);
    field.notifyDirty();
  };

  const interactive = !lock && !field.state.disabled;

  return (
    <span className={cn('flex w-full items-center gap-2', className)} {...field.state.dataProps}>
      {/* 진짜 컨트롤 — 시각적으로 감추되 포커스·폼 전송은 살아 있다. */}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        id={field.id}
        name={field.state.submits ? name : undefined}
        accept={accept}
        aria-invalid={showInvalid ? true : undefined}
        aria-describedby={field['aria-describedby']}
        disabled={field.state.disabled || lock}
        onChange={handleChange}
      />
      {/* 파일명 표시 박스 — 입력이 아니라 표시다. 클릭해도 대화상자를 열지 않는다(버튼이 연다). */}
      <span
        className={cn(
          'dl-field flex min-w-0 flex-1 items-center',
          FIELD_SIZE_CLASS[field.size],
          showInvalid && 'dl-field-error',
          field.state.lockClass,
        )}
      >
        <span className={cn('truncate', displayName === '' && 'text-dl-field-placeholder')}>
          {displayName || (interactive ? placeholder : null)}
        </span>
        {value && interactive ? (
          <button
            type="button"
            aria-label={clearLabel}
            onClick={clear}
            className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-dl-badge text-dl-field-caret hover:bg-dl-option-hover hover:text-dl-fg"
          >
            <Icon icon={X} className="size-3" />
          </button>
        ) : null}
        {lock ? (
          <span className="ml-auto flex shrink-0 items-center text-dl-locked-icon">
            <Icon icon={Lock} size="lock" />
          </span>
        ) : null}
      </span>
      {/* lock 은 버튼 자체를 감춘다 — 영구 불변 칸에 비활성 버튼은 거짓 어포던스다. */}
      {lock ? null : (
        <Button
          size={field.size}
          disabled={field.state.disabled}
          // 칸 전체가 disabled 모드라 이유가 자명하다 — Button 의 "왜 못 누르는지" 경고만 잠재운다.
          title={field.state.disabled ? buttonLabel : undefined}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </Button>
      )}
    </span>
  );
}
