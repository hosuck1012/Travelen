import "server-only";

import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MYREALTRIP_MCP_URL = "https://mcp-servers.myrealtrip.com/mcp";
const SEARCH_TOOL_NAME = "searchTnas";

type McpTool = Awaited<ReturnType<Client["listTools"]>>["tools"][number];

type WidgetNode = {
  type?: unknown;
  children?: unknown;
  value?: unknown;
  weight?: unknown;
  src?: unknown;
  onClickAction?: unknown;
};

export type MyRealTripProduct = {
  id?: string;
  title?: string;
  price?: string;
  currency?: string;
  imageUrl?: string;
  rating?: number;
  location?: string;
  productUrl?: string;
};

export type MyRealTripRecommendationInput = {
  destination: string;
  startDate?: string;
  endDate?: string;
  companion?: string;
  travelStyles: string[];
  limit: number;
};

export type MyRealTripMcpErrorKind = "connection" | "tool-not-found" | "response";

export class MyRealTripMcpError extends Error {
  constructor(public readonly kind: MyRealTripMcpErrorKind) {
    super(kind);
    this.name = "MyRealTripMcpError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function withMcpClient<T>(callback: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ name: "travelen-myrealtrip", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MYREALTRIP_MCP_URL));
  let connected = false;

  try {
    await client.connect(transport);
    connected = true;
    return await callback(client);
  } catch (error) {
    if (error instanceof MyRealTripMcpError) throw error;
    throw new MyRealTripMcpError(connected ? "response" : "connection");
  } finally {
    await Promise.allSettled([client.close(), transport.close()]);
  }
}

export async function listMyRealTripTools(): Promise<McpTool[]> {
  return withMcpClient(async (client) => {
    const result = await client.listTools();
    return result.tools;
  });
}

function getSearchPayload(result: Awaited<ReturnType<Client["callTool"]>>): Record<string, unknown> {
  if ("structuredContent" in result && isRecord(result.structuredContent)) {
    return result.structuredContent;
  }

  if (!("content" in result) || !Array.isArray(result.content)) {
    throw new MyRealTripMcpError("response");
  }

  const textContent = result.content.find(
    (content): content is Extract<(typeof result.content)[number], { type: "text" }> => content.type === "text",
  );
  if (!textContent) throw new MyRealTripMcpError("response");

  try {
    const payload: unknown = JSON.parse(textContent.text);
    if (!isRecord(payload)) throw new MyRealTripMcpError("response");
    return payload;
  } catch (error) {
    if (error instanceof MyRealTripMcpError) throw error;
    throw new MyRealTripMcpError("response");
  }
}

function collectNodes(value: unknown, nodes: WidgetNode[] = []): WidgetNode[] {
  if (!isRecord(value)) return nodes;
  nodes.push(value);
  if (Array.isArray(value.children)) {
    value.children.forEach((child) => collectNodes(child, nodes));
  }
  return nodes;
}

function getActionUrl(node: WidgetNode): string | undefined {
  if (!isRecord(node.onClickAction)) return undefined;
  return typeof node.onClickAction.url === "string" ? node.onClickAction.url : undefined;
}

function normalizeProduct(item: unknown): MyRealTripProduct | null {
  if (!isRecord(item)) return null;
  const nodes = collectNodes(item);
  const textValues = nodes
    .filter((node) => node.type === "Text" && typeof node.value === "string")
    .map((node) => ({ value: node.value as string, weight: node.weight }));
  const productUrl = getActionUrl(item) ?? nodes.map(getActionUrl).find(Boolean);
  const title = textValues.find(({ value, weight }) => weight === "bold" && !/\d[\d,]*\s*원/.test(value))?.value.trim();
  const price = textValues.find(({ value }) => /\d[\d,]*\s*원/.test(value))?.value.trim();
  const ratingText = textValues.find(({ value }) => value.startsWith("⭐"))?.value;
  const ratingMatch = ratingText?.match(/⭐\s*(\d+(?:\.\d+)?)/);
  const imageUrl = nodes.find((node) => node.type === "Image" && typeof node.src === "string")?.src as string | undefined;
  const id = productUrl?.match(/\/(?:products|offers)\/([^/?#]+)/)?.[1];

  const product: MyRealTripProduct = {};
  if (id) product.id = id;
  if (title) product.title = title;
  if (price) {
    product.price = price;
    product.currency = "KRW";
  }
  if (imageUrl) product.imageUrl = imageUrl;
  if (ratingMatch) product.rating = Number(ratingMatch[1]);
  if (productUrl) product.productUrl = productUrl;

  return Object.keys(product).length > 0 ? product : null;
}

function normalizeSearchPayload(payload: Record<string, unknown>): MyRealTripProduct[] {
  if (!isRecord(payload.widget) || !Array.isArray(payload.widget.children)) {
    throw new MyRealTripMcpError("response");
  }

  return payload.widget.children
    .map(normalizeProduct)
    .filter((product): product is MyRealTripProduct => product !== null);
}

const destinationNames = [
  "서울", "부산", "제주", "서귀포", "강릉", "속초", "경주", "전주", "여수", "순천", "인천", "수원", "춘천", "대전",
  "대구", "광주", "울산", "포항", "통영", "거제", "남해", "도쿄", "오사카", "교토", "후쿠오카", "오키나와", "삿포로",
  "방콕", "치앙마이", "다낭", "하노이", "호치민", "세부", "보라카이", "발리", "싱가포르", "홍콩", "타이베이", "파리",
  "런던", "로마", "바르셀로나", "뉴욕", "로스앤젤레스", "시드니", "산토리니",
];

const styleKeywords: Array<{ styles: string[]; keywords: string[] }> = [
  { styles: ["맛집 탐방", "미식", "음식"], keywords: ["음식", "미식", "맛집", "시장", "쿠킹", "요리", "푸드", "카페", "디저트", "와인"] },
  { styles: ["자연과 풍경", "자연 풍경", "자연"], keywords: ["해변", "바다", "산", "트레킹", "하이킹", "전망", "자연", "공원", "섬", "숲"] },
  { styles: ["액티비티", "레저"], keywords: ["체험", "투어", "레저", "액티비티", "크루즈", "서핑", "요트", "스키", "자전거"] },
  { styles: ["유명 관광지", "관광"], keywords: ["시티투어", "박물관", "궁", "전망대", "명소", "유적", "도슨트", "입장권"] },
  { styles: ["카페"], keywords: ["카페", "커피", "디저트", "베이커리", "티"] },
  { styles: ["쇼핑"], keywords: ["쇼핑", "시장", "아울렛", "백화점", "기념품"] },
  { styles: ["역사와 문화", "역사", "문화"], keywords: ["역사", "문화", "박물관", "궁", "유적", "전통", "도슨트"] },
  { styles: ["휴양"], keywords: ["휴식", "스파", "마사지", "온천", "힐링", "해변"] },
  { styles: ["야경"], keywords: ["야경", "야간", "밤", "노을", "선셋"] },
  { styles: ["사진 촬영", "사진"], keywords: ["사진", "스냅", "포토", "전망", "야경", "노을"] },
];

const companionKeywords: Record<string, string[]> = {
  가족: ["가족", "아이", "키즈", "어린이", "편안", "원데이"],
  연인: ["야경", "감성", "사진", "스냅", "데이트", "노을", "선셋", "와인"],
  친구: ["체험", "투어", "레저", "액티비티", "맛집", "야경"],
  혼자: ["도슨트", "워크", "산책", "클래스", "원데이", "투어"],
};

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
}

function getDestinationTokens(destination: string): string[] {
  return destination
    .split(/[,/]/)
    .map((token) => normalizeSearchText(token))
    .filter((token) => token.length >= 2);
}

function isDestinationRelevant(product: MyRealTripProduct, destination: string): boolean {
  const destinationTokens = getDestinationTokens(destination);
  const title = normalizeSearchText(product.title ?? "");
  const location = normalizeSearchText(product.location ?? "");
  const searchable = `${title} ${location}`;

  if (location) return destinationTokens.some((token) => location.includes(token) || token.includes(location));
  if (destinationTokens.some((token) => searchable.includes(token))) return true;

  const conflictingDestination = destinationNames
    .map(normalizeSearchText)
    .find((name) => searchable.includes(name) && !destinationTokens.some((token) => name.includes(token) || token.includes(name)));
  return conflictingDestination === undefined;
}

function getSeasonKeywords(startDate?: string, endDate?: string): string[] {
  const date = startDate ?? endDate;
  if (!date) return [];
  const month = Number(date.slice(5, 7));
  if ([12, 1, 2].includes(month)) return ["겨울", "눈", "스키", "실내", "온천"];
  if ([3, 4, 5].includes(month)) return ["봄", "벚꽃", "꽃", "산책", "공원"];
  if ([6, 7, 8].includes(month)) return ["여름", "해변", "바다", "물", "서핑", "요트"];
  if ([9, 10, 11].includes(month)) return ["가을", "단풍", "트레킹", "산", "산책"];
  return [];
}

function countKeywordMatches(text: string, keywords: string[]): number {
  return keywords.reduce((count, keyword) => count + (text.includes(normalizeSearchText(keyword)) ? 1 : 0), 0);
}

function getRecommendationScore(product: MyRealTripProduct, input: MyRealTripRecommendationInput): number {
  const text = normalizeSearchText([product.title, product.location].filter(Boolean).join(" "));
  let score = 0;

  for (const group of styleKeywords) {
    if (input.travelStyles.some((style) => group.styles.some((name) => normalizeSearchText(style).includes(normalizeSearchText(name))))) {
      score += countKeywordMatches(text, group.keywords) * 3;
    }
  }

  score += countKeywordMatches(text, companionKeywords[input.companion ?? ""] ?? []) * 2;
  score += countKeywordMatches(text, getSeasonKeywords(input.startDate, input.endDate));
  return score;
}

export function rankMyRealTripProducts(
  products: MyRealTripProduct[],
  input: MyRealTripRecommendationInput,
): MyRealTripProduct[] {
  return products
    .map((product, index) => ({ product, index, score: getRecommendationScore(product, input) }))
    .filter(({ product }) => isDestinationRelevant(product, input.destination))
    .sort((left, right) => right.score - left.score || (right.product.rating ?? 0) - (left.product.rating ?? 0) || left.index - right.index)
    .slice(0, input.limit)
    .map(({ product }) => product);
}

export async function searchMyRealTripProducts(destination: string, limit: number): Promise<MyRealTripProduct[]> {
  return withMcpClient(async (client) => {
    const { tools } = await client.listTools();
    if (!tools.some((tool) => tool.name === SEARCH_TOOL_NAME)) {
      throw new MyRealTripMcpError("tool-not-found");
    }

    const result = await client.callTool({
      name: SEARCH_TOOL_NAME,
      arguments: {
        query: `${destination} 투어`,
        sort: "recommended",
        page: 1,
        perPage: limit,
      },
    });
    if ("isError" in result && result.isError) throw new MyRealTripMcpError("response");

    return normalizeSearchPayload(getSearchPayload(result)).slice(0, limit);
  });
}
