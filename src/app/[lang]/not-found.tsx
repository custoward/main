import Link from "next/link";
import { getCopy } from "@/data/site";
import layout from "@/components/layout.module.css";

/**
 * 옛 사이트(CRA)는 없는 주소에도 200 을 돌려줬다 — 검색엔진에 유령 페이지가
 * 쌓이는 상태였다. Next 로 오면서 정상 404 가 된다.
 *
 * 언어를 알 수 없는 자리라(잘못된 lang 으로도 들어온다) 한국어로 둔다.
 */
export default function NotFound() {
  const copy = getCopy("ko");

  return (
    <section className={layout.pageBody} style={{ paddingBlock: "var(--sp-section)" }}>
      <div className={layout.container}>
        <h1 style={{ fontSize: "var(--fs-h1)" }}>{copy.notFound.heading}</h1>
        <p style={{ marginTop: "var(--sp-4)", color: "var(--fg-muted)" }}>
          {copy.notFound.body}
        </p>
        <p style={{ marginTop: "var(--sp-8)" }}>
          <Link href="/ko" style={{ textDecoration: "underline" }}>
            {copy.notFound.back}
          </Link>
        </p>
      </div>
    </section>
  );
}
