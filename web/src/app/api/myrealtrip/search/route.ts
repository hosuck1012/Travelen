import { MyRealTripMcpError, searchMyRealTripProducts } from "@/lib/myrealtrip-mcp";

export const runtime = "nodejs";

function parseLimit(value: string | null): number | null {
  if (value === null) return 3;
  if (!/^\d+$/.test(value)) return null;

  const limit = Number(value);
  return limit >= 1 && limit <= 10 ? limit : null;
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const destination = searchParams.get("destination")?.trim();
  const limit = parseLimit(searchParams.get("limit"));

  if (!destination) {
    return Response.json({ error: "여행지를 입력해 주세요." }, { status: 400 });
  }
  if (limit === null) {
    return Response.json({ error: "limit은 1 이상 10 이하의 정수여야 합니다." }, { status: 400 });
  }

  try {
    const products = await searchMyRealTripProducts(destination, limit);
    return Response.json({ products });
  } catch (error) {
    if (error instanceof MyRealTripMcpError && error.kind === "tool-not-found") {
      return Response.json({ error: "마이리얼트립 검색 도구를 사용할 수 없습니다." }, { status: 500 });
    }

    return Response.json({ error: "마이리얼트립 상품 검색에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
