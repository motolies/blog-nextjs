# CKEditor 업데이트

- `ckeditor5` 폴더에 저장한 소스를 가지고 커스텀빌드해서 사용중이었는데 nextjs15 버전으로 업데이트 하고 난 뒤 css가 적용이 잘 안되서 사용하기 어려움
- 대한으로 `/ckeditor5-builder-46.1.0` 폴더에 새로 빌드 버전을 받아두었음
  - `https://ckeditor.com/ckeditor-5/builder/` 에서 커스텀한 내용 다운로드 했으나 확인해보니 그냥 npm install 로 사용 가능
- `ckeditor5` 제거, "ckeditor5-custom-build": "file:ckeditor5" 의존성 제거 등 모두 제거 하고
- 현재 `DynamicEditor.jsx` 의 내용을 `https://ckeditor.com/ckeditor-5/builder/` 처럼 생성하고 로드할 수 있도록 소스코드 수정하여 구현

