"use strict";

//!
//! @module logger
//!
//! Very basic utility to log things to a dedicated output channel. This should be loaded first
//! on extension registration since all the other modules might use it.
//!
//! Also, this module should never use any other "local" modules (things in our own code folder)
//! to make sure it can be loaded first and not introduced cyclic dependency or whatever.
//!


import * as vscode from "vscode";


//!
//! The output channel.
//!
let outputChannel: vscode.OutputChannel;

//!
//! If true, output debug stuff
//!
let development: boolean = false;

//!
//! Call once before everything else at the extension's activation
//!
export function initialize(context: vscode.ExtensionContext, name: string) {
    outputChannel = vscode.window.createOutputChannel(name);
    context.subscriptions.push(outputChannel);
}

//!
//! Toggle the development channel
//!
export function enableDevelopmentMode(enabled: boolean) {
    development = enabled;
}

//!
//! log
//!
export function log(...args: any[]) {
    logTo(outputChannel, ...args);
}

//!
//! debug
//!
export function debug(...args: any[]) {
    if (development !== undefined) {
        logTo(outputChannel, ...args);
    }
}

//!
//! Clear the content of the default output channel
//!
export function clear() {
    outputChannel.clear();
}

//!
//! Log things to an output channel.
//!
function logTo(channel: vscode.OutputChannel, ...args: any[]) {
    // format the message
    let message: string = "";
    for (const arg of args) {
        if (typeof arg === "object") {
            message += JSON.stringify(arg, null, "  ");
        } else {
            message += arg.toString();
        }
    }

    // push the channel to the foreground if we are in dev mode
    // @todo(damien) make this optionable instead
    if (development === true) {
        channel.show(true);
    }

    // log
    // @todo(damien) bit crappy, should add proper functions for that, or an argument to log/debug
    if (message.endsWith("\n") === true) {
        channel.append(message);
    } else {
        channel.appendLine(message);
    }
}
