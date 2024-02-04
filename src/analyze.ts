// 采集
import { chromium, type Page } from "playwright";
import { getAllTextContent } from "./utils";
import cookies from "./cookies";
import * as vscode from "vscode";
import { updateEnvInfoByHostname } from "./DBApi";

export interface IProjectUrl {
  projectName: string;
  url: string;
  envUrls: IEnvUrl[];
}
export declare interface IEnvUrl {
  envName: string;
  url: string;
  pools: IPool[];
}
export declare interface IPool {
  poolName: string;
  url: string;
}

const analyzeProjectUrl = async (page: Page, hostname: string): Promise<IProjectUrl[]> => {
  const trs = await page.$$("#projectstatus tbody tr");
  return await Promise.all(
    [...trs].map(async (tr) => {
      const a = (await tr.$("td:nth-child(3) a"))!;
      const href = (await a.getAttribute("href"))!;
      const projectName = await getAllTextContent(a);
      return {
        projectName,
        url: decodeURIComponent(hostname + href),
        envUrls: [],
      };
    })
  );
};
const analyzeEnvUrl = async (page: Page, hostname: string): Promise<IEnvUrl[]> => {
  const tabs_a = await page.$$(".tabBar .tab a");
  return await Promise.all(
    [...tabs_a].map(async (a) => {
      const envName = await getAllTextContent(a);
      const url = decodeURIComponent((await a.getAttribute("href")) + "");
      return {
        envName,
        url: decodeURIComponent(hostname + url),
        pools: [],
      };
    })
  );
};
const analyzePoolUrl = async (page: Page, envUrl: string): Promise<IPool[]> => {
  const trs = await page.$$("#projectstatus tbody tr");
  return await Promise.all(
    [...trs].map(async (tr) => {
      const a = (await tr.$("td:nth-child(3) a"))!;
      const href = (await a.getAttribute("href"))!;
      const poolName = await getAllTextContent(a);
      return {
        poolName,
        url: decodeURIComponent(envUrl + href),
      };
    })
  );
};

export const analyze = async (hostname: string | undefined) => {
  const browser = await chromium.launch({
    headless: false,
  });
  const page = await browser.newPage();
  const context = page.context();
  context.addCookies(cookies as any);
  page.on("close", (err) => {
    console.log("~页面关闭了,停止解析~", err);
  });
  await page.goto(hostname!);
  await page.waitForURL(hostname!);
  const projectNodes = await analyzeProjectUrl(page, hostname!);
  for (const projectNode of projectNodes) {
    const { url: projectUrl } = projectNode;
    await page.goto(projectUrl);
    await page.waitForURL(projectUrl);
    projectNode.envUrls = await analyzeEnvUrl(page, hostname!);
    for (const envNode of projectNode.envUrls) {
      const { url: envUrl } = envNode;
      await page.goto(envUrl);
      await page.waitForURL(envUrl);
      envNode.pools = await analyzePoolUrl(page, envUrl!);
    }
    await page.goBack();
  }
  await browser.close();
  return projectNodes;
};

export default async () => {
  const hostname = await vscode.window.showInputBox({
    placeHolder: "请输入采集地址",
    value: "",
  });
  if (!hostname) {
    return;
  }
  const envInfo = await analyze(hostname);
  await updateEnvInfoByHostname(hostname!, envInfo);
  vscode.window.showInformationMessage("采集完成");
};
