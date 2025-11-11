/**
 * DataForSEO API Client
 * Documentation: https://docs.dataforseo.com/v3/
 */

interface DataForSEOConfig {
  login: string;
  password: string;
  baseUrl?: string;
}

interface DataForSEOResponse<T = any> {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: any;
    result: T;
  }>;
}

export class DataForSEOClient {
  private login: string;
  private password: string;
  private baseUrl: string;

  constructor(config?: DataForSEOConfig) {
    this.login = config?.login || process.env.DATAFORSEO_LOGIN || '';
    this.password = config?.password || process.env.DATAFORSEO_PASSWORD || '';
    this.baseUrl = config?.baseUrl || 'https://api.dataforseo.com/v3';

    if (!this.login || !this.password) {
      throw new Error(
        'DataForSEO credentials not found. Please set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.'
      );
    }
  }

  /**
   * Make authenticated request to DataForSEO API
   */
  private async request<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    data?: any
  ): Promise<DataForSEOResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const auth = Buffer.from(`${this.login}:${this.password}`).toString('base64');

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DataForSEO API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get keyword search volume, competition, and CPC data
   * @param keywords Array of keywords to research
   * @param location Location code (e.g., 2840 for USA)
   * @param language Language code (e.g., 'en' for English)
   */
  async getKeywordData(
    keywords: string[],
    location: number = 2840,
    language: string = 'en'
  ) {
    const endpoint = '/keywords_data/google_ads/search_volume/live';

    const payload = [{
      keywords,
      location_code: location,
      language_code: language,
    }];

    return this.request(endpoint, 'POST', payload);
  }

  /**
   * Get keyword suggestions and related keywords
   * @param keyword Seed keyword
   * @param location Location code
   * @param language Language code
   */
  async getKeywordSuggestions(
    keyword: string,
    location: number = 2840,
    language: string = 'en'
  ) {
    const endpoint = '/keywords_data/google_ads/keywords_for_keywords/live';

    const payload = [{
      keywords: [keyword],
      location_code: location,
      language_code: language,
      include_seed_keyword: true,
      include_serp_info: true,
      limit: 100,
    }];

    return this.request(endpoint, 'POST', payload);
  }

  /**
   * Get SERP (Search Engine Results Page) data for keywords
   * @param keyword Keyword to analyze
   * @param location Location name (e.g., "United States")
   * @param language Language code
   */
  async getSerpData(
    keyword: string,
    location: string = 'United States',
    language: string = 'en'
  ) {
    const endpoint = '/serp/google/organic/live/advanced';

    const payload = [{
      keyword,
      location_name: location,
      language_code: language,
      device: 'desktop',
      os: 'windows',
      depth: 100, // Number of results to return
    }];

    return this.request(endpoint, 'POST', payload);
  }

  /**
   * Get keyword ideas based on a seed keyword
   * @param keyword Seed keyword
   * @param location Location name
   * @param language Language code
   */
  async getKeywordIdeas(
    keyword: string,
    location: string = 'United States',
    language: string = 'en'
  ) {
    const endpoint = '/keywords_data/google_ads/keywords_for_site/live';

    const payload = [{
      keywords: [keyword],
      location_name: location,
      language_code: language,
    }];

    return this.request(endpoint, 'POST', payload);
  }

  /**
   * Analyze competitors in search results
   * @param keyword Keyword to analyze
   * @param location Location name
   */
  async getCompetitorAnalysis(
    keyword: string,
    location: string = 'United States'
  ) {
    const endpoint = '/serp/google/organic/live/advanced';

    const payload = [{
      keyword,
      location_name: location,
      device: 'desktop',
      depth: 20,
    }];

    return this.request(endpoint, 'POST', payload);
  }

  /**
   * Get local search results (Google Maps/Local Pack)
   * @param keyword Keyword to search
   * @param location Location coordinates or name
   */
  async getLocalSearchResults(
    keyword: string,
    location: string = 'United States'
  ) {
    const endpoint = '/serp/google/maps/live/advanced';

    const payload = [{
      keyword,
      location_name: location,
      language_code: 'en',
    }];

    return this.request(endpoint, 'POST', payload);
  }

  /**
   * Analyze on-page SEO factors
   * @param url URL to analyze
   */
  async getOnPageAnalysis(url: string) {
    const endpoint = '/on_page/instant_pages';

    const payload = [{
      url,
      enable_javascript: true,
      enable_browser_rendering: true,
    }];

    return this.request(endpoint, 'POST', payload);
  }

  /**
   * Get backlink data for a domain
   * @param domain Domain to analyze
   */
  async getBacklinks(domain: string) {
    const endpoint = '/backlinks/summary/live';

    const payload = [{
      target: domain,
    }];

    return this.request(endpoint, 'POST', payload);
  }

  /**
   * Get domain metrics (authority, rankings, etc.)
   * @param domain Domain to analyze
   */
  async getDomainMetrics(domain: string) {
    const endpoint = '/domain_analytics/overview/live';

    const payload = [{
      target: domain,
    }];

    return this.request(endpoint, 'POST', payload);
  }

  /**
   * Search for keywords related to hockey advisors
   */
  async getHockeyAdvisorKeywords() {
    const seedKeywords = [
      'hockey advisor',
      'hockey agent',
      'hockey recruiting',
      'hockey consultant',
      'hockey training',
    ];

    const results = await Promise.all(
      seedKeywords.map(keyword => this.getKeywordSuggestions(keyword))
    );

    return results;
  }

  /**
   * Analyze local competition for hockey advisors in a specific location
   */
  async analyzeLocalCompetition(city: string, state: string) {
    const keyword = `hockey advisor ${city} ${state}`;
    const location = `${city}, ${state}, United States`;

    const [serpData, localData] = await Promise.all([
      this.getSerpData(keyword, location),
      this.getLocalSearchResults(keyword, location),
    ]);

    return {
      serp: serpData,
      local: localData,
    };
  }
}

// Export singleton instance (lazy-loaded)
let _instance: DataForSEOClient | null = null;

export function getDataForSEOClient(): DataForSEOClient {
  if (!_instance) {
    _instance = new DataForSEOClient();
  }
  return _instance;
}

// Backward compatibility - only create if environment variables are set
export const dataForSEO = process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD
  ? new DataForSEOClient()
  : null as any;

// Export types
export type { DataForSEOConfig, DataForSEOResponse };
