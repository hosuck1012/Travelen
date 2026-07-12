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
