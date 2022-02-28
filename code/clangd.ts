"use strict";

//!
//! @module clangd
//!

import * as vscode   from "vscode";
import * as vscodelc from "vscode-languageclient/node";
import * as logger   from "./logger";
import * as utils    from "./utils";


//! Cached clangd executable path
let path: string = "clangd";

//! Cached clangd executable options
let options: string[] = [];

//! Extension context
let context: vscode.ExtensionContext;

//! The running client
let client: vscodelc.LanguageClient;

//! Disposable returned by vscodelc.LanguageClient.start
let client_start: vscode.Disposable;

//!
//! Called once on extension registration, this will initialize the module and start the language client/server.
//!
export function initialize(context_: vscode.ExtensionContext) {
    // remember the context
    context = context_;

    // start the client
    start();
}

//!
//! Set the path to clangd executable
//!
export const setPath = utils.registerCommand("set_path", async (path_: string) => {
    if (path_ !== path) {
        logger.debug("clangd.setPath(", path_, ")");
        path = path_;
        restart();
    }
});

//!
//! Set the options to pass to clangd executable
//!
export const setOptions = utils.registerCommand("set_options", async (options_: string[]) => {
    let diff: boolean = options.length !== options_.length;
    if (diff === false) {
        for (let i in options_) {
            if (options[i] === options_[i]) {
                diff = true;
                break;
            }
        }
    }
    if (diff === true) {
        logger.debug("clangd.setOptions(", options_, ")");
        options = options_;
        restart();
    }
});

//!
//! Start the language client (will start the server too)
//!
export async function start(): Promise< void > {
    logger.debug("clangd.start...");

    // create the clangd executable
    const clangd: vscodelc.Executable = {
        command: path,
        args:    options,
        options: { cwd: vscode.workspace.workspaceFolders[0].uri.fsPath || process.cwd() }
    };

    // create the client options
    const client_options: vscodelc.LanguageClientOptions = {
        documentSelector: [
            { scheme: "file", language: "c" },
            { scheme: "file", language: "cpp" }
        ]
    };

    // create the client
    client = new vscodelc.LanguageClient("clangdLanguageServer", "Clangd Language Server", clangd as vscodelc.Executable, client_options);

    // start it
    client_start = client.start();

    logger.debug("clangd.started");
}

//!
//! Stop the currently running server
//!
export async function stop(): Promise< void > {
    logger.debug("clangd.stop...");

    if (client !== undefined) {
        await client.stop();
        client = undefined;
    }
    if (client_start !== undefined) {
        await client_start.dispose();
        client_start = undefined;
    }

    logger.debug("clangd.stopped");
}

//!
//! Shortcut to stop() followed by start()
//!
//! Does nothing (not even start it) if the client has not been started once. This allows configuration
//! callbacks to not bother and always call restart after a config changes, and then the extension can just
//! start the client once everything's synchronized.
//!
async function restart(): Promise< void > {
    if (client !== undefined) {
        await stop();
        await start();
    }
}
