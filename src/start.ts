import * as vscode from "vscode";
import { deployed } from "./deployed";
// 启动部署流程
export const start = async () => {
  vscode.window.showInformationMessage("即将启动部署流程~");

  // 请选择本次的部署方式
  const method = await vscode.window.showQuickPick(["一键部署", "手动录入信息"], {
    placeHolder: "请选择本次的部署方式",
  });
  vscode.window.showInformationMessage("heihei " + method);

  deployed();
};

// 启动部署流程
export const quickStart = async () => {
  vscode.window.showInformationMessage("将使用上次部署的信息进行快速部署.");
};
