import {config, logger} from './config.js';
import {PWDCrawler} from './lab/pwd-crawler.js';
import {sleep} from './lab/utils.js';

logger.logOther('!: Auto-PWD :!');

const pwdBrowser = new PWDCrawler({
  name: config.name,
  headless: config.puppeteer.headless,
  devtools: config.puppeteer.devtool,
});

await pwdBrowser.readyStatePromise;

if (config.account.cookie === undefined) {
  throw new Error('ّUser id cookie must be set');
}
await pwdBrowser.loginWithCookie(config.account.cookie);

if (config.account.id === undefined || config.account.password === undefined) {
  throw new Error('User id & password must be set');
}
await pwdBrowser.loginWithPassword({
  id: config.account.id,
  password: config.account.password,
});

while (!(await pwdBrowser.checkLoginStatus())) {
  await sleep(3000);
}

const err = await pwdBrowser.startSession();
if (err !== null) {
  throw new Error(err.message);
}

await pwdBrowser.addNewInstance();

await pwdBrowser.enterCommand(`
echo $HOST
curl -fsSL https://raw.githubusercontent.com/njfamirm/dotfiles/main/install.sh | bash
`);

// await pwdBrowser.close();

logger.logOther('Done!');
