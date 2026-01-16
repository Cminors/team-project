import puppeteer, { Browser, Page } from 'puppeteer'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { addExtra } from 'puppeteer-extra'

// Add stealth plugin
const puppeteerExtra = addExtra(puppeteer as any)
puppeteerExtra.use(StealthPlugin())

export interface LaunchBrowserOptions {
  headless?: boolean
  userDataDir?: string
}

export async function launchBrowser(
  options: LaunchBrowserOptions = {}
): Promise<Browser> {
  const headless = options.headless ?? true

  return await puppeteerExtra.launch({
    headless,
    userDataDir: options.userDataDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080',
    ],
  }) as Browser
}

interface BrowserInstance {
  browser: Browser
  inUse: boolean
  createdAt: Date
}

class BrowserPool {
  private pool: Map<string, BrowserInstance> = new Map()
  private maxSize: number
  private maxIdleTime: number // milliseconds

  constructor(maxSize: number = 5, maxIdleTime: number = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.maxIdleTime = maxIdleTime

    // Cleanup idle browsers every 2 minutes
    setInterval(() => this.cleanupIdleBrowsers(), 2 * 60 * 1000)
  }

  async acquire(): Promise<{ browserId: string; browser: Browser }> {
    // Try to find an available browser
    for (const [id, instance] of this.pool.entries()) {
      if (!instance.inUse) {
        instance.inUse = true
        instance.createdAt = new Date()
        return { browserId: id, browser: instance.browser }
      }
    }

    // Create new browser if pool not full
    if (this.pool.size < this.maxSize) {
      const browser = await this.createBrowser()
      const id = this.generateId()
      this.pool.set(id, {
        browser,
        inUse: true,
        createdAt: new Date(),
      })
      return { browserId: id, browser }
    }

    // Wait for a browser to become available
    await this.delay(1000)
    return this.acquire()
  }

  release(browserId: string) {
    const instance = this.pool.get(browserId)
    if (instance) {
      instance.inUse = false
    }
  }

  async destroy(browserId: string) {
    const instance = this.pool.get(browserId)
    if (instance) {
      await instance.browser.close()
      this.pool.delete(browserId)
    }
  }

  async destroyAll() {
    for (const [id] of this.pool.entries()) {
      await this.destroy(id)
    }
  }

  private async createBrowser(): Promise<Browser> {
    return await launchBrowser({ headless: true })
  }

  private async cleanupIdleBrowsers() {
    const now = new Date().getTime()
    for (const [id, instance] of this.pool.entries()) {
      if (
        !instance.inUse &&
        now - instance.createdAt.getTime() > this.maxIdleTime
      ) {
        await this.destroy(id)
      }
    }
  }

  private generateId(): string {
    return `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  getPoolSize(): number {
    return this.pool.size
  }

  getAvailableCount(): number {
    return Array.from(this.pool.values()).filter((i) => !i.inUse).length
  }
}

// Singleton instance
export const browserPool = new BrowserPool()

export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage()

  // Set a realistic viewport
  await page.setViewport({ width: 1920, height: 1080 })

  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  })

  return page
}
