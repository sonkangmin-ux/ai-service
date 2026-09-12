import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 학습 나침반",
  description: "IT 입문자가 목표와 수행 결과로 지금 할 과제를 정하는 학습 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-background text-text antialiased">
        <a className="skip-link" href="#main">
          본문으로 건너뛰기
        </a>
        {children}
      </body>
    </html>
  );
}
