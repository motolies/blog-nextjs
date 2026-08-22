import Footer from './Footer';
import Header from './Header';
import MetaHeader from './MetaHeader';
import Section from './Section';
import skipStyles from './SkipNavigation.module.css';

interface CommonLayoutProps {
  children: React.ReactNode;
}

// 공개 영역 셸 — sticky 헤더 + 본문(flex:1) + 푸터의 세로 flex 단일 컬럼
export default function CommonLayout({ children }: CommonLayoutProps) {
  return (
    <>
      <a href="#main-content" className={skipStyles.skipLink}>
        본문으로 건너뛰기
      </a>
      <MetaHeader />
      <div className="public-page flex min-h-dvh flex-col">
        <Header />
        <Section>{children}</Section>
        <Footer />
      </div>
    </>
  );
}
