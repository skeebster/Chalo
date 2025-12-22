// src/lib/webScraping.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrape content from a website URL
 * @param url The URL to scrape
 * @returns The HTML content as a string
 */
export async function scrapeWebsite(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error scraping website ${url}:`, error);
    return '';
  }
}

/**
 * Extract specific information from HTML content using CSS selectors
 * @param html The HTML content to parse
 * @param selector The CSS selector to use for extraction
 * @returns The extracted text
 */
export function extractInformation(html: string, selector: string): string {
  try {
    const $ = cheerio.load(html);
    return $(selector).text().trim();
  } catch (error) {
    console.error('Error extracting information:', error);
    return '';
  }
}

/**
 * Extract multiple elements from HTML content using CSS selectors
 * @param html The HTML content to parse
 * @param selector The CSS selector to use for extraction
 * @returns Array of extracted text from each matching element
 */
export function extractMultipleElements(html: string, selector: string): string[] {
  try {
    const $ = cheerio.load(html);
    const elements: string[] = [];
    
    $(selector).each((_, element) => {
      elements.push($(element).text().trim());
    });
    
    return elements;
  } catch (error) {
    console.error('Error extracting multiple elements:', error);
    return [];
  }
}

/**
 * Extract structured data from a website (events, hours, etc.)
 * @param html The HTML content to parse
 * @param config Configuration object with selectors for different data points
 * @returns Object containing the extracted structured data
 */
export function extractStructuredData(html: string, config: Record<string, string>): Record<string, string> {
  try {
    const $ = cheerio.load(html);
    const result: Record<string, string> = {};
    
    for (const [key, selector] of Object.entries(config)) {
      result[key] = $(selector).text().trim();
    }
    
    return result;
  } catch (error) {
    console.error('Error extracting structured data:', error);
    return {};
  }
}

/**
 * Extract links from HTML content
 * @param html The HTML content to parse
 * @param baseUrl The base URL to resolve relative links
 * @returns Array of extracted links
 */
export function extractLinks(html: string, baseUrl: string): string[] {
  try {
    const $ = cheerio.load(html);
    const links: string[] = [];
    
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        // Resolve relative URLs
        const absoluteUrl = new URL(href, baseUrl).toString();
        links.push(absoluteUrl);
      }
    });
    
    return links;
  } catch (error) {
    console.error('Error extracting links:', error);
    return [];
  }
}
