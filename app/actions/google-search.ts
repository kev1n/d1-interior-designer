"use server";

interface SearchQuery {
  title: string;
  totalResults: string;
  searchTerms: string;
  count: number;
  startIndex: number;
  startPage: number;
  language: string;
  inputEncoding: string;
  outputEncoding: string;
  safe: string;
  cx: string;
  searchType?: string;
  imgSize?: string;
  imgType?: string;
  imgColorType?: string;
  imgDominantColor?: string;
  [key: string]: string | number | undefined;
}

interface SearchResult {
  kind: string;
  url: {
    type: string;
    template: string;
  };
  queries: {
    previousPage?: SearchQuery[];
    request: SearchQuery[];
    nextPage?: SearchQuery[];
  };
  searchInformation: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
  items?: Array<{
    kind: string;
    title: string;
    htmlTitle: string;
    link: string;
    displayLink: string;
    snippet: string;
    htmlSnippet: string;
    mime: string;
    fileFormat: string;
    image: {
      contextLink: string;
      height: number;
      width: number;
      byteSize: number;
      thumbnailLink: string;
      thumbnailHeight: number;
      thumbnailWidth: number;
    };
  }>;
}

/**
 * Server action to search for images using Google Custom Search API
 * @param query The search query
 * @returns SearchResult object containing image results
 */
export async function searchImages(
  query: string
): Promise<{ results?: SearchResult; error?: string }> {
  try {
    if (!query) {
      return { error: "Search query is required" };
    }

    const searchApiKey = process.env.SEARCH_API_KEY;
    const cxKey = process.env.CX_KEY;

    if (!searchApiKey || !cxKey) {
      throw new Error(
        "SEARCH_API_KEY or CX_KEY not found in environment variables"
      );
    }

    // Construct the API URL with the search parameters
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.append("key", searchApiKey);
    url.searchParams.append("cx", cxKey);
    url.searchParams.append("q", query);
    url.searchParams.append("searchType", "image");

    // Make the API request
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data: SearchResult = await response.json();
    return { results: data };
  } catch (error) {
    console.error("Error searching images:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
