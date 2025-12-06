import * as vscode from "vscode";
import { openTest } from "./commands/open-test";
import { Projects } from "./resolver/project";
import { Logging } from "./utils/logger";

export function activate(context: vscode.ExtensionContext) {
  Projects.init();
  Logging.init();

  Logging.info("[Activate] Testely is now active ✨");

  vscode.commands.executeCommand("setContext", "testely.supportedLangIds", [
    "typescript",
    "typescriptreact",
    "java",
  ]);

  let openTestDisposable = vscode.commands.registerCommand(
    "testely.openTest",
    (args, thisArg) => {
      Logging.telemetry.logUsage("openTest");

      try {
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
      } catch (error) {
        Logging.error("[OpenTest] Failed to open test file", { error });

        Logging.telemetry.logError("openTest", { error });
        return vscode.window.showErrorMessage(
          "Unexpected error occurred while opening test file."
        );
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
