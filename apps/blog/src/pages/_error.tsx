import * as Sentry from '@sentry/nextjs';
import type { NextPage } from 'next';
import NextError, { type ErrorProps } from 'next/error';

/**
 * Pages Router 전역 에러 페이지 — SSR/렌더링 중 오류를 Sentry 로 보고한 뒤 기본 에러 UI 를 보여준다.
 * getInitialProps 에서 await 해야 서버리스가 아니어도 전송 완료가 보장된다 (공식 패턴).
 */
const CustomErrorComponent: NextPage<ErrorProps> = (props) => (
  <NextError statusCode={props.statusCode} />
);

CustomErrorComponent.getInitialProps = async (contextData) => {
  await Sentry.captureUnderscoreErrorException(contextData);
  return NextError.getInitialProps(contextData);
};

export default CustomErrorComponent;
