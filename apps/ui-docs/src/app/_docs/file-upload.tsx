import type { FileUploadProps } from '@hvy/ui';
import { FileUploadBasicDemo } from '../../client/ui-test/docs/demos/file-upload/basic';
import { FileUploadMaxSizeDemo } from '../../client/ui-test/docs/demos/file-upload/max-size';
import { FileUploadModesDemo } from '../../client/ui-test/docs/demos/file-upload/modes';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Field, FileUpload } from '@hvy/ui';

<Field label="정산 근거 자료" htmlFor="evidence" error={errors.evidence}>
  <FileUpload
    id="evidence"
    accept=".pdf,.xlsx"
    buttonLabel="파일 선택"
    onReject={(file) => notifyReject(file.name)}
  />
</Field>`;

/** FileUpload 문서 — 단일 파일 + 확장자 제한, 검증의 단일 진실 소스는 accept 다. */
export const fileUploadDoc: DocEntry = {
  slug: 'file-upload',
  category: 'components',
  title: 'FileUpload',
  description:
    '단일 파일 + 확장자 제한 전용 업로드. 파일명 표시 박스(dl-field) + [파일 선택] 버튼 + 숨긴 네이티브 input 조합이다 — 파일 대화상자·키보드·폼 전송은 전부 네이티브 동작이고 시각만 박스·버튼이 맡는다(Checkbox 의 "네이티브 살려두기" 패턴). 검증의 단일 진실 소스는 accept 하나다 — 같은 문자열이 대화상자 필터와 선택 재검증 양쪽에 쓰이고, 위반 파일은 값으로 받지 않은 채(이전 값 유지) onReject 로 알린다. 안내 문구는 앱이 띄운다 — ui 는 사전을 모른다(buttonLabel 이 필수인 이유와 같다). 상태 계약(mode·lock)을 따르며 lock 은 선택·지우기 버튼 자체를 감춘다 — 영구 불변 칸에 비활성 버튼은 거짓 어포던스다. 프로그램으로 주입한 value(File)는 네이티브 input 에 되돌려 넣지 않아 FormData 에 실리지 않는다 — 사용자가 대화상자로 고른 파일만 실리므로 실전 업로드는 fetch/BFF 경로(multipart)가 정석이고 name 은 그 보조다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '기본 — 확장자 제한과 거부',
      note: 'accept=".pdf,.xlsx" 한 값이 대화상자 필터와 선택 재검증 양쪽에 쓰인다 — 대화상자에서 "모든 파일"로 바꿔 다른 확장자를 골라도 값으로 받지 않는다(이전 값 유지 + 오류 배색 + onReject). 거부 안내 문구는 앱이 Field 의 error 로 띄웠다 — ui 는 사전을 모른다. fileName 은 서버에 이미 있는 파일명(교체 전 상태) — 값이 비어 있을 때 대신 표시하고, × 는 고른 파일만 지운다(서버 파일 삭제는 앱의 몫).',
      file: 'src/client/ui-test/docs/demos/file-upload/basic.tsx',
      Component: FileUploadBasicDemo,
    },
    {
      id: 'max-size',
      title: '크기 상한 (maxSize)',
      note: '확장자와 달리 크기는 대화상자가 걸러 주지 않는 축이라 선택 시 검증이 유일한 UX 방어선이다(진짜 방어는 서버 몫). onReject 의 reason 이 "extension" | "size" 로 갈리므로 앱이 사유별 문구를 고른다. 1MB 초과 파일을 골라 볼 것.',
      file: 'src/client/ui-test/docs/demos/file-upload/max-size.tsx',
      Component: FileUploadMaxSizeDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled + lock',
      note: '열마다 FormMode 로 감은 정적 대비. view 는 파일명 텍스트만 남고(빈값이면 빈칸 — placeholder 금지 규칙) 행 높이가 편집 컨트롤과 같다. disabled 는 박스·버튼이 남은 채 비활성이다. lock 은 [파일 선택] 버튼 자체가 사라진다 — 영구 불변 칸에 비활성 버튼은 거짓 어포던스이고, 자물쇠는 어느 모드에서도 유지된다(lock 은 모든 mode 를 이긴다).',
      file: 'src/client/ui-test/docs/demos/file-upload/modes.tsx',
      Component: FileUploadModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'FileUpload',
      rows: definePropRows<FileUploadProps>()([
        {
          name: 'value',
          type: 'File | null',
          description:
            '주면 controlled. 프로그램 주입 File 은 FormData 에 실리지 않는다 — 사용자가 대화상자로 고른 파일만 실린다.',
        },
        {
          name: 'defaultValue',
          type: 'File | null',
          defaultValue: 'null',
          description:
            '비제어 초기값 — 선택형 컨트롤 규약(관리형)이라 비제어에서도 view 가 성립한다.',
        },
        {
          name: 'onValueChange',
          type: '(file: File | null) => void',
          description:
            '유효한 선택·지우기 때 호출된다. 거부된 파일로는 호출되지 않는다(onReject 로 간다).',
        },
        {
          name: 'name',
          type: 'string',
          description:
            '있으면 숨긴 네이티브 input 이 든다 — 사용자가 고른 파일만 FormData 에 실린다. 실전 업로드는 fetch/BFF(multipart)가 정석이고 이건 보조다.',
        },
        {
          name: 'accept',
          type: 'string',
          description:
            '확장자 제한 — ".pdf,.xlsx" 형식. 대화상자 필터(네이티브)와 선택 재검증(fileValidation.ts)이 이 한 값을 쓴다 — 검증의 단일 진실 소스.',
        },
        {
          name: 'maxSize',
          type: 'number',
          description:
            '크기 상한(바이트, 포함) — 대화상자가 걸러 주지 않는 축이라 선택 시 검증한다. 위반은 reason "size" 로 거부된다.',
        },
        {
          name: 'onReject',
          type: "(file: File, reason: 'extension' | 'size') => void",
          description:
            '검증 위반으로 값이 거부됐을 때 — 이전 값은 유지되고 오류 배색이 켜진다. reason 으로 사유별 문구를 고른다. 안내 문구는 앱이 띄운다(ui 는 사전을 모른다).',
        },
        {
          name: 'fileName',
          type: 'string',
          description:
            '서버에 이미 있는 파일의 이름 — 값이 비어 있을 때 대신 표시한다(교체 전 상태). view 모드의 표시값으로도 쓰인다.',
        },
        {
          name: 'buttonLabel',
          type: 'string',
          required: true,
          description: '[파일 선택] 버튼 문구. ui 는 사전을 모른다 — 그래서 필수다.',
        },
        {
          name: 'placeholder',
          type: 'string',
          description:
            '값도 fileName 도 없을 때 박스에 표시 — lock·disabled 칸에서는 감춘다(입력 신호 제거).',
        },
        {
          name: 'clearLabel',
          type: 'string',
          defaultValue: "'파일 지우기'",
          description: '× 버튼의 접근성 이름 — 고른 파일만 지운다(서버 파일 삭제는 앱의 몫).',
        },
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          defaultValue: "'edit'",
          description:
            '폼 모드 — 생략하면 감싼 Field/FormMode 를 따르고 명시하면 이긴다(단독 상태 유지). view 는 파일명 텍스트만 남는다.',
        },
        {
          name: 'lock',
          type: 'boolean',
          description:
            '시스템 채움 영구 불변 — 선택·지우기 버튼을 감추고 자물쇠를 단다. 모든 mode 를 이긴다.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description:
            'Field 밖 단독 사용 시의 오류 배색. 내부 거부 상태(rejected)와 OR 로 합쳐진다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '5단 사이즈 — 파일명 박스와 버튼이 같은 단계로 움직인다.',
        },
        {
          name: 'id',
          type: 'string',
          description: '숨긴 네이티브 input 에 붙는다 — Field 의 htmlFor 가 가리키는 대상이다.',
        },
        {
          name: 'className',
          type: 'string',
          description: '루트 래퍼(박스 + 버튼 행)에 붙는다.',
        },
      ]),
    },
  ],
};
