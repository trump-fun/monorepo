// Making a request to Truth Social API using Puppeteer with Puppeteer-Stealth
import { Browser, ConsoleMessage, HTTPResponse } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

export async function fetchWithPuppeteer(url: string) {
  console.log(`Starting direct fetch with puppeteer-stealth...`);

  // Launch browser without proxy
  console.log('Launching browser...');
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-dev-shm-usage',
      ],
      timeout: 60000,
    });

    console.log(`Fetching data from: ${url}`);
    const page = await browser.newPage();

    // Handle console logs from the browser
    page.on('console', (msg: ConsoleMessage) => console.log('Browser console:', msg.text()));

    // Set timeout for navigation
    page.setDefaultNavigationTimeout(30000);

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    );

    // Response data storage
    let responseData = null;

    // Response handler
    page.on('response', async (response: HTTPResponse) => {
      if (response.url() === url) {
        console.log(`Response status from event: ${response.status()}`);
        if (response.status() === 200) {
          try {
            const contentType = response.headers()['content-type'] || '';
            // Handle JSON response
            if (contentType.includes('application/json')) {
              const data = await response.json();
              responseData = data;
            } else {
              // Handle text response
              const text = await response.text();
              try {
                // Try to parse as JSON even if content-type is not JSON
                responseData = JSON.parse(text);
              } catch (e) {
                responseData = { text };
              }
            }
          } catch (e) {
            console.error('Error parsing response from event:', e);
          }
        }
      }
    });

    // Navigate to API endpoint with timeout and wait options
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Get response data
    if (response) {
      const statusCode = response.status();
      console.log(`Response status: ${statusCode}`);

      if (statusCode === 200) {
        try {
          // If we already have data from the event, use that
          if (!responseData) {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('application/json')) {
              responseData = await response.json();
            } else {
              const text = await response.text();
              try {
                responseData = JSON.parse(text);
              } catch (e) {
                responseData = { text };
              }
            }
          }
          return responseData;
        } catch (e) {
          console.error('Error parsing response:', e);
        }
      } else {
        console.error(`Error: ${statusCode} ${response.statusText()}`);
      }
    }

    // Wait a bit before closing the browser
    await new Promise(resolve => setTimeout(resolve, 2000));
    return responseData;
  } catch (error) {
    console.error(`Error during fetch:`, error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

// Export the fetchWithPuppeteer function as default
export default { fetchWithPuppeteer };
