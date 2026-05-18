"use client";

import { kmsfChartsPackage } from "@kmsf/charts";
import { kmsfDataTablePackage } from "@kmsf/data-table";
import { kmsfGridstackPackage } from "@kmsf/gridstack";

const packages = [
  {
    name: kmsfChartsPackage,
    description: "차트 렌더링 컴포넌트 패키지 연결 상태 확인",
  },
  {
    name: kmsfDataTablePackage,
    description: "데이터 테이블 패키지 연결 상태 확인",
  },
  {
    name: kmsfGridstackPackage,
    description: "레이아웃 그리드 패키지 연결 상태 확인",
  },
];

export default function ExamplePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">KMSF Example</p>
        <h1>패키지 소비 검증용 대시보드</h1>
        <p className="description">
          이 앱은 메인 제품 앱이 아니라, 로컬 workspace 패키지가 외부 소비자 관점에서 정상 import
          되고 렌더링되는지 확인하기 위한 예제입니다.
        </p>
      </section>

      <section className="package-grid" aria-label="kmsf package consumers">
        {packages.map((item) => (
          <article className="package-card" key={item.name}>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
