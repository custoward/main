import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { LANGS, brand, getCopy, isLang, type Lang } from "@/data/site";
import "../globals.css";

/**
 * Pretendard 는 CDN 이 아니라 저장소 안에 넣어 쓴다.
 * 예전엔 jsDelivr 의 @latest 를 불렀는데, 버전이 안 박혀 있어서 상류가 바뀌면
 * 사이트 글자도 같이 바뀌고 외부 장애에 그대로 노출됐다.
 */
const pretendard = localFont({
  src: "../../../public/fonts/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
});

/**
 * 이 파일이 곧 루트 레이아웃이다 (app/layout.tsx 를 두지 않았다).
 * <html lang> 을 언어마다 다르게 찍으려면 언어를 아는 위치가 루트여야 하기 때문이다.
 * "/" 로 들어오면 next.config.ts 가 /ko 로 보낸다.
 */
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = getCopy(lang);

  // 문구를 아직 안 채웠으면 브랜드 이름만 내보낸다.
  const title = copy.meta.title || brand.name;

  return {
    metadataBase: new URL(brand.url),
    title: { default: title, template: `%s — ${brand.name}` },
    description: copy.meta.description || undefined,
    icons: { icon: "/favicon.ico" },
    alternates: {
      canonical: `/${lang}`,
      languages: { ko: "/ko", en: "/en" },
    },
    openGraph: {
      type: "website",
      siteName: brand.name,
      locale: lang === "ko" ? "ko_KR" : "en_US",
      url: `/${lang}`,
      title,
      description: copy.meta.description || undefined,
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const copy = getCopy(lang as Lang);

  return (
    <html lang={copy.htmlLang} className={pretendard.variable}>
      <body>
        <SiteHeader lang={lang as Lang} />
        <main>{children}</main>
        <SiteFooter lang={lang as Lang} />
      </body>
    </html>
  );
}
