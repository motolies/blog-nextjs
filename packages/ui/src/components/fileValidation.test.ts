import { describe, expect, it } from 'vitest';
import { acceptedExtensions, isAcceptedFile, isAcceptedFileSize } from './fileValidation';

describe('acceptedExtensions', () => {
  it('.ext 토큰만 소문자로 뽑는다 — MIME 토큰은 버린다', () => {
    expect(acceptedExtensions('.PDF, image/*, .Xlsx')).toEqual(['.pdf', '.xlsx']);
  });

  it('미지정·빈 문자열·점 하나짜리 토큰은 빈 목록', () => {
    expect(acceptedExtensions(undefined)).toEqual([]);
    expect(acceptedExtensions('')).toEqual([]);
    expect(acceptedExtensions('.')).toEqual([]);
  });
});

describe('isAcceptedFile', () => {
  it('확장자 제한을 대소문자 무시하고 판정한다', () => {
    expect(isAcceptedFile('.pdf,.xlsx', '보고서.PDF')).toBe(true);
    expect(isAcceptedFile('.pdf,.xlsx', 'data.xlsx')).toBe(true);
    expect(isAcceptedFile('.pdf,.xlsx', 'photo.png')).toBe(false);
  });

  it('.ext 토큰이 없으면(미지정·MIME 만) 항상 통과 — 검증할 계약이 없다', () => {
    expect(isAcceptedFile(undefined, 'anything.bin')).toBe(true);
    expect(isAcceptedFile('image/*', 'photo.png')).toBe(true);
  });

  it('겹확장자는 끝만 본다 — archive.tar.gz 는 .gz 로 통과', () => {
    expect(isAcceptedFile('.gz', 'archive.tar.gz')).toBe(true);
    expect(isAcceptedFile('.tar', 'archive.tar.gz')).toBe(false);
  });
});

describe('isAcceptedFileSize', () => {
  it('상한 포함으로 판정한다 — 딱 맞는 크기는 통과', () => {
    expect(isAcceptedFileSize(1024, 1024)).toBe(true);
    expect(isAcceptedFileSize(1024, 1025)).toBe(false);
    expect(isAcceptedFileSize(1024, 0)).toBe(true);
  });

  it('상한 미지정이면 항상 통과 — 검증할 계약이 없다', () => {
    expect(isAcceptedFileSize(undefined, Number.MAX_SAFE_INTEGER)).toBe(true);
  });
});
