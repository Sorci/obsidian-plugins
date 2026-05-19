import { requestUrl } from "obsidian";

export async function fetchHtml(url: string, userAgent: string): Promise<string> {
  const res = await requestUrl({
    url,
    method: "GET",
    headers: {
      "User-Agent": userAgent,
      Referer: url
    }
  });

  return res.text;
}
