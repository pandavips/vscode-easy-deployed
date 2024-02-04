import { start } from "./start";
import fetchEnvInfo from "./analyze";
import { deployed } from "./deployed";

import * as vscode from "vscode";
export function activate() {
  vscode.commands.registerCommand("deployed.start", deployed);
  vscode.commands.registerCommand("deployed.quick-start", start);
  vscode.commands.registerCommand("deployed.config", start);
  vscode.commands.registerCommand("deployed.analyze", fetchEnvInfo);
}
