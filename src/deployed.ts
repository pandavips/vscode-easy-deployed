// 部署
import { chromium } from "playwright";
import * as vscode from "vscode";
import { getGitRemoteUrl, getAppName, getGitBranch, vscodeConfirm } from "./utils";
import { getCookiesByHostname, getHostnames, getEnvInfoByHostname } from "./DBApi";
import { IEnvUrl, IProjectUrl } from "./analyze";

export const deployed = async () => {
  // 让用户选择对应的发布环境地址
  const hosynameList = await getHostnames();
  const hostname = await vscode.window.showQuickPick(hosynameList, {
    placeHolder: "请选择一个发布环境地址",
  });
  if (!hostname) {
    return vscode.window.showErrorMessage("已取消");
  }
  // 2.根据hostname拉取有效的cookies
  let useCookie;
  const cookies = await getCookiesByHostname(hostname!);
  // 选择一个cookie
  const authorCookie = await vscode.window.showQuickPick(
    cookies.map((cookie) => cookie.author + "-" + `${cookie.create_time}`),
    {
      placeHolder: "请选择一个有效的cookie",
    }
  );
  useCookie = cookies.find((cookie) => {
    return cookie.author + "-" + `${cookie.create_time}` === authorCookie;
  }) || { body: [], author: "无名" };
  // 3.获取host环境信息
  const projectNodes = await getEnvInfoByHostname(hostname!);
  // 让用户选择一个项目
  const projectName = await vscode.window.showQuickPick(
    projectNodes.map((env) => env.projectName),
    {
      placeHolder: "请选择一个项目",
    }
  );
  if (!projectName) {
    return vscode.window.showErrorMessage("已取消");
  }
  // 让用户选择一个环境
  const projectNode: IProjectUrl = projectNodes.find((env) => env.projectName === projectName)!;
  const envName = await vscode.window.showQuickPick(
    projectNode?.envUrls.map((env: IEnvUrl) => env.envName),
    {
      placeHolder: "请选择一个环境",
    }
  );
  if (!envName) {
    return vscode.window.showErrorMessage("已取消");
  }
  // 让用户选择一个pool
  const envNode: IEnvUrl = projectNode.envUrls.find((env) => env.envName === envName)!;
  const poolName = await vscode.window.showQuickPick(
    envNode?.pools.map((pool) => pool.poolName),
    {
      placeHolder: "请选择一个构建池",
    }
  );
  if (!poolName) {
    return vscode.window.showErrorMessage("已取消");
  }
  const poolNode = envNode.pools.find((pool) => pool.poolName === poolName)!;

  // 获取git信息
  const GIT_REMOTE_URL = await getGitRemoteUrl();
  const APP_NAME = getAppName();
  const BRANCH = await getGitBranch();
  await vscodeConfirm("请确认以下信息(重点关注前3条),点击确定按钮进行部署:", {
    detail: `
    环境: ${envName}.
    项目名称: ${projectName}.
    Git仓库: ${GIT_REMOTE_URL}.
    Git分支: ${BRANCH}.
    构建池名称: ${poolName}.
    deploy_app: ${APP_NAME}.
    域名: ${hostname}.
    cookie归属人:${useCookie.author}.
    `,
    modal: true,
  });

  const browser = await chromium.launch({
    headless: false,
  });
  const page = await browser.newPage();

  const context = page.context();
  context.addCookies(useCookie.body);
  page.on("close", () => {
    console.log("~页面被关闭了~");
    browser.close();
  });
  await page.goto(poolNode.url, {
    waitUntil: "load",
  });
  await page.waitForLoadState("networkidle");

  // 在页面中添加一个cookie贡献按钮

  await page.click("text=Build with Parameters");
  await page.waitForLoadState("networkidle");
  const locator = await page.locator("select");

  if ((await locator.count()) > 1) {
    // 选择框模式
    const firstElement = await locator.first();
    const lastElement = await locator.last();
    await firstElement.selectOption(APP_NAME);
    await page.waitForTimeout(1000);
    await lastElement.selectOption(BRANCH!);
  } else {
    // 输入框模式
    const inputLocator = await page.locator(".jenkins-input");
    await inputLocator.nth(0).fill(GIT_REMOTE_URL!);
    await inputLocator.nth(1).fill(BRANCH!);
  }

  // (await page.locator(".jenkins-button")).click();
  // await page.waitForLoadState("networkidle");

  await page.evaluate((cookies) => {
    const button = document.createElement("button");
    button.innerText = "人人为我\n我为人人\n✊贡献我的cookie!";
    button.style.cursor = "pointer";
    button.style.position = "fixed";
    button.style.bottom = "5%";
    button.style.right = "5%";
    button.style.zIndex = "999";
    // 美化下样式
    button.style.padding = "30px";
    button.style.background = "pink";
    button.style.color = "white";
    button.style.fontSize = "28px";
    button.style.aspectRatio = "1/1";
    // 变成一个半径30的圆
    button.style.borderRadius = "50%";
    // button.style.width = "220px";
    // button.style.height = "220px";
    // flex文字居中
    button.style.display = "flex";
    button.style.justifyContent = "center";
    button.style.alignItems = "center";
    // 阴影
    button.style.boxShadow = "0 0 20px rgba(0,0,0,.3)";

    button.onclick = async (event) => {
      button.innerText = "贡献中......";
      button.style.pointerEvents = "none";

      // TODO 更换地址
      fetch("http://localhost:3000/cookies", {
        method: "POST",
        body: JSON.stringify(cookies),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          button.innerText = "贡献成功!\n谢谢伟大的您!🙇‍";
          button.style.background = "green";
          button.style.color = "white";
        })
        .catch((err) => {
          button.style.pointerEvents = "auto";
          button.innerText = "啊?\n贡献失败了?\n我要再次尝试!";
          button.style.background = "red";
          button.style.color = "white";
        });
    };

    document.body.appendChild(button);
  }, await context.cookies());
};
