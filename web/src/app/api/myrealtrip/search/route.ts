import {
  MyRealTripMcpError,
  rankMyRealTripProducts,
  searchMyRealTripProducts,
} from "@/lib/myrealtrip-mcp";

export const runtime = "nodejs";

function parseLimit(value: string | null): number | null {
  if (value === null) return 3;
  if (!/^\d+$/.test(value)) return null;

  const limit = Number(value);
  return limit >= 1 && limit <= 10 ? limit : null;
}

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const destination = searchParams.get("destination")?.trim();
  const startDate = searchParams.get("startDate")?.trim();
  const endDate = searchParams.get("endDate")?.trim();
  const companion = searchParams.get("companion")?.trim();
  const travelStyles = searchParams.getAll("travelStyles").map((style) => style.trim()).filter(Boolean);
  const limit = parseLimit(searchParams.get("limit"));

  if (!destination) {
    return Response.json({ error: "여행지를 입력해 주세요." }, { status: 400 });
  }
  if (limit === null) {
    return Response.json({ error: "limit은 1 이상 10 이하의 정수여야 합니다." }, { status: 400 });
  }
  if ((startDate && !endDate) || (!startDate && endDate) || (startDate && endDate && (!isDate(startDate) || !isDate(endDate) || startDate > endDate))) {
    return Response.json({ error: "여행 날짜를 올바른 YYYY-MM-DD 범위로 입력해 주세요." }, { status: 400 });
  }
  if ((companion?.length ?? 0) > 20 || travelStyles.length > 10 || travelStyles.some((style) => style.length > 30)) {
    return Response.json({ error: "동행 유형 또는 여행 취향 입력값을 확인해 주세요." }, { status: 400 });
  }

  try {
    const candidateLimit = Math.min(Math.max(limit * 4, 12), 30);
    const candidates = await searchMyRealTripProducts(destination, candidateLimit);
    const products = rankMyRealTripProducts(candidates, {
      destination,
      startDate,
      endDate,
      companion,
      travelStyles,
      limit,
    });
    return Response.json({ products });
  } catch (error) {
    if (error instanceof MyRealTripMcpError && error.kind === "tool-not-found") {
      return Response.json({ error: "마이리얼트립 검색 도구를 사용할 수 없습니다." }, { status: 500 });
    }

    return Response.json({ error: "마이리얼트립 상품 검색에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
