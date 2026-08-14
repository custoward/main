import Link from "next/link";
import { brand, getCopy, hasAboutContent, otherLang, type Lang } from "@/data/site";
import s from "./layout.module.css";

/**
 * 헤더.
 *
 * 옛 사이트는 링크가 `/Designer` 인데 라우트는 `/designer` 라서 내비가 전부
 * 죽어 있었다. 이제 주소를 여기서 한 번에 만들어 그런 어긋남이 안 생긴다.
 */
export default function SiteHeader({ lang }: { lang: Lang }) {
  const copy = getCopy(lang);
  const other = otherLang(lang);

  // 아직 아무것도 안 채운 페이지는 아예 안 보여준다. 눌렀더니 제목만 덩그러니
  // 있는 화면이 나오는 것보다, 없는 편이 낫다.
  // 작업(/work)은 "곧 채워집니다" 한 줄이라도 나오므로 그대로 둔다.
  const links = [
    { href: `/${lang}/work`, label: copy.nav.work, show: true },
    { href: `/${lang}/about`, label: copy.nav.about, show: hasAboutContent(copy) },
    { href: `/${lang}/contact`, label: copy.nav.contact, show: true },
  ].filter((l) => l.show);

  return (
    <header className={s.header}>
      <div className={`${s.container} ${s.headerInner}`}>
        <Link href={`/${lang}`} className={s.logo}>
          {/*
            지금은 글자로 둔다. public/logo.webp 는 "FOR THE BETTER WORLD" 라고
            적힌 이전 브랜드 워드마크라 다비다비 이름 자리에 쓸 수 없다.
            새 로고가 나오면 여기에 <Image> 로 갈아끼우면 된다.
          */}
          {brand.name}
        </Link>

        <nav className={s.nav}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={s.navLink}>
              {l.label}
            </Link>
          ))}
          {/* 언어를 바꿔도 보던 위치를 유지하는 건 나중 일이다.
              지금은 페이지가 넷뿐이라 각 언어의 첫 화면으로 보낸다. */}
          <Link
            href={`/${other}`}
            className={s.langSwitch}
            hrefLang={other}
            aria-label={other === "en" ? "Switch to English" : "한국어로 보기"}
          >
            {copy.switchTo}
          </Link>
        </nav>
      </div>
    </header>
  );
}
