"use strict";

//!
//! @module extension
//!
//! Entry point of the extension.
//!


import * as vscode   from "vscode";
import * as utils    from "./utils";
import * as logger   from "./logger";


//!
//! Called once on extension's activation
//!
export async function activate(context: vscode.ExtensionContext) {
    // init our utility modules
    logger.initialize(context, "Clangd");
    utils. initialize(context);

    // import clangd module and initialize it (it will create the client and server parts)
    const clangd = await import("./clangd");
    clangd.initialize(context);

    // initialization/loading done
    logger.debug("extension activated");

    // listen to config changes and set things up
    // note: await the development option to catch all initialization logs
    await utils.watchConfiguration("clangd", "development", enabled => { logger.enableDevelopmentMode(enabled); });
          utils.watchConfiguration("clangd", "path",        path    => { clangd.setPath(path); });
          utils.watchConfiguration("clangd", "options",     options => { clangd.setOptions(options); });

    // and start
    clangd.start();
}

//!
//! Called once on extension's deactivation. Can be used to properly unregister commands, etc.?
//!
export async function deactivate(): Promise< void > {
    // @todo handle that with a disposable thing directly from inside clangd module.
    const clangd = await import("./clangd");
    clangd.stop();

    logger.debug("extension deactivated");
}
