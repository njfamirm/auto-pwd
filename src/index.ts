import {Browser} from './lab/browser.js';

const browser = new Browser({
  headless: false
});

await browser.readyStatePromise;
const page = await browser.openPage('https://google.com');
await page?.type(
    'body > div.L3eUgb > div.o3j99.ikrT4e.om7nvf > form > div:nth-child(1) > div.A8SBwf > div.RNNXgb > div > div.a4bIc > input',
    'puppeteer',
);
await page?.keyboard.press('Enter')
