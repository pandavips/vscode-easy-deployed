import { ElementHandle } from "playwright";
import * as vscode from "vscode";
import git from "simple-git";
import fs from "fs";

// 获取当前工作目录
export const getWorkspacePath = () => {
  const { workspaceFolders } = vscode.workspace;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("请打开一个项目目录");
    return;
  }
  const { uri } = workspaceFolders[0];
  const { fsPath } = uri;
  return fsPath;
};

/**
 * 在playwright中获取节点下的所有文本内容
 * @param node 节点
 * @returns 所有文本内容
 */
export const getAllTextContent = async (node: ElementHandle): Promise<string> => {
  const text = await node.evaluate((node) => {
    const text = node.textContent;
    return text;
  });
  return text || "";
};

const baseGit = () => {
  return git(getWorkspacePath());
};

// 获取远程仓库地址
export const getGitRemoteUrl = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    baseGit()?.listRemote(["--get-url"], (err, data) => {
      if (err) {
        vscode.window.showErrorMessage("获取git信息失败");
        reject(err);
        return;
      }
      resolve(data);
    });
  });
};

// 获取当前分支
export const getGitBranch = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    baseGit()?.branchLocal((err, data) => {
      if (err) {
        vscode.window.showErrorMessage("获取git信息失败");
        reject(err);
        return;
      }
      resolve(data.current);
    });
  });
};

// 读取配置文件
export const getAppName = (): string => {
  const path = getWorkspacePath();
  // const config = require(`${path}/.jenkinsenv`);
  // 读取jenkinsenv文件内容
  const config = fs.readFileSync(`${path}/jenkinsenv`, "utf-8");
  const { apps: appName } = JSON.parse(config);
  return appName;
};

// 在vscode中弹出确认操作,在用户进行确认后,返回true
export const vscodeConfirm = async (message: string, options: vscode.MessageOptions = {}) => {
  const confirmLabel = "确认";
  const cancelLabel = "取消";
  return new Promise((resolve) => {
    vscode.window.showInformationMessage(message, options, confirmLabel, cancelLabel).then((selection) => {
      if (selection === confirmLabel) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

// TODO 在playwright中向页面中添加一个按钮,并绑定相应的事件
export const addBtnToPage = async (page: any, btnConfig: any) => {
  await page.evaluate((payload: any) => {
    const {
      text,
      // payload,
      clickHandler = () => {
        console.log("你没有实现按钮");
      },
    } = btnConfig;

    const btn = document.createElement("button");
    btn.innerText = text;
    btn.style.position = "fixed";
    btn.style.right = "10px";
    btn.style.top = "10px";
    btn.addEventListener("click", clickHandler);
    document.body.appendChild(btn);
  }, btnConfig);
};
