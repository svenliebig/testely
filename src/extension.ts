import * as vscode from "vscode";
import { openTest } from "./commands/open-test";
import { Projects } from "./resolver/project";
import { logger } from "./utils/logger";

export function activate(context: vscode.ExtensionContext) {
  logger.logUsage("activate", {
    message: "Testely is now active ✨",
  });

  Projects.init();

  vscode.commands.executeCommand("setContext", "testely.supportedLangIds", [
    "typescript",
    "typescriptreact",
    "java",
  ]);

  let openTestDisposable = vscode.commands.registerCommand(
    "testely.openTest",
    (args, thisArg) => {
      if (args) {
        vscode.workspace.openTextDocument(args).then((document) => {
          return openTest(document);
        });
      } else {
        const { document } = vscode.window.activeTextEditor || {};

        if (!document) {
          return vscode.window.showErrorMessage(
            "Could not manage to find file for test creation."
          );
        }

        return openTest(document);
      }
    }
  );

  let openSourceDisposable = vscode.commands.registerCommand(
    "testely.openSource",
    (args, thisArg) => {
      if (args) {
        vscode.workspace.openTextDocument(args).then((document) => {
          return openTest(document);
        });
      } else {
        const { document } = vscode.window.activeTextEditor || {};

        if (!document) {
          return vscode.window.showErrorMessage(
            "Could not manage to find file for test creation."
          );
        }

        return openTest(document);
      }
    }
  );

  context.subscriptions.push(openTestDisposable, openSourceDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
