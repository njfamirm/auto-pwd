import {createLogger} from '@alwatr/logger';
import {launch} from 'puppeteer';

import type {Page, PuppeteerOption, PptrBrowser, PptrPage} from './type.js';
import type {WaitForOptions} from 'puppeteer';

export class Browser {
  readyStatePromise;
  pages: Page = {};

  protected _browser?: PptrBrowser;
  protected _readyState = false;
  protected _activePages: Array<PptrPage> = [];
  protected _logger;

  private __option;
  private __freePage: PptrPage | null = null;

  constructor(option?: PuppeteerOption) {
    this.__option = option;
    this._logger = createLogger(`${option?.name}-browser` ?? 'browser');

    this.readyStatePromise = this._init().catch((err) => {
      this._logger.error('_init', 'init_failed', (err as Error).stack);
    });
  }

  private get option(): PuppeteerOption | undefined {
    return this.__option;
  }

  get browser(): PptrBrowser | undefined {
    return this._browser;
  }

  protected async _init(): Promise<void> {
    this._logger.logMethod('_init');
    try {
      this._browser = await launch(this.option);
    } catch (err) {
      this._logger.error('_init', 'LAUNCH_BROWSER_FAILED', (err as Error).message);
      throw new Error((err as Error).message, {cause: (err as Error).cause});
    }

    this._readyState = true;
    this.__freePage = (await this.activePages())[0] ?? null;
  }

  async activePages(): Promise<Array<PptrPage>> {
    if (!this._readyState) throw new Error('not_ready');
    this._logger.logMethod('activePages');
    this._activePages = (await this._browser?.pages()) ?? [];
    return this._activePages;
  }

  async close(): Promise<void> {
    if (!this._readyState) throw new Error('not_ready');
    this._logger.logMethod('close');
    this._browser?.close();
  }

  async openPage(name: string, url: string, w4option?: WaitForOptions): Promise<void> {
    if (!this._readyState) throw new Error('not_ready');

    this._logger.logMethodArgs('openPage', {name: name, url: url});
    const page = this.__freePage ?? (await this._browser?.newPage());
    await page?.goto(url, w4option);
    if (page === undefined) {
      this._logger.error('openPage', 'page_undefined', 'Page undefined');
      return;
    }
    const pageName = name.toLocaleLowerCase();
    this.pages[pageName] = page;
  }

  async getPagesUrl(): Promise<Array<string>> {
    const pagesUrl: Array<string> = [];
    // eslint-disable-next-line guard-for-in
    for (const page in this.pages) {
      pagesUrl.push(this.pages[page].url());
    }
    return pagesUrl;
  }
}
