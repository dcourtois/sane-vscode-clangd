"use strict";

//!
//! @module utils
//!
//! Collection of various small utilities.
//!

import * as vscode  from "vscode";
import * as path    from "path";
import * as process from "process";
import * as logger  from "./logger";

//!
//! Small class used to store a configuration watcher
//!
class ConfigurationListener {
    //! The configuration category
    category: string;
    //! The configuration key
    key: string;
    //! The section (used with vscode.ConfigurationChangeEvent.affectsConfiguration)
    section: string;
    //! The callback
    callback: (value: any) => any;
}

//!
//! Extension context.
//!
let context: vscode.ExtensionContext;

//!
//! Configuration change listeners
//!
const configurationChangeListeners: ConfigurationListener[] = [];

//!
//! Initialize the module. Call once only.
//!
export function initialize(context_: vscode.ExtensionContext) {
    context = context_;

    // register for configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
        // thanks to the owesome vscode.ConfigurationChangeEvent, we have no fucking way to retrieve the exact
        // configuration that was changed, so we need to iterate on all our registered listeners to find the ones
        // that are affected...
        for (const listener of configurationChangeListeners) {
            if (event.affectsConfiguration(listener.section)) {
                getConfig(listener.category, listener.key).then(listener.callback);
            }
        }
    }));
}

//!
//! Replace all tokens in the given string
//!
async function handleSubstitution(input: string): Promise< string > {
    for (const match of input.matchAll(/\${(\w+)(?::([\w\.]+))?}/g)) {
        let result = null;
        switch (match[1]) {
            case "env":
                if (match[1] in process.env) {
                    result = process.env[match[2]];
                } else {
                    result = undefined;
                    logger.debug(`utils.getConfig - env var "${match[2]}" not know. Ignoring.`);
                }
                break;
            case "command":
                const command_result = await vscode.commands.executeCommand(match[2]);
                if (command_result !== undefined && command_result !== null) {
                    result = command_result.toString();
                } else {
                    result = undefined;
                    logger.debug(`utils.getConfig - command "${match[2]}" either not found or returned nothing. Ignoring.`);
                }
                break;
            case "workspaceFolder":
                if (vscode.workspace.workspaceFolders.length > 0) {
                    result = vscode.workspace.workspaceFolders[0].uri.fsPath;
                } else {
                    result = undefined;
                    logger.debug("utils.getConfig - ${workspaceFolder} used but no workspace folder set. Ignoring.");
                }
                break;
            case "workspaceFolderBasename":
                if (vscode.workspace.workspaceFolders.length > 0) {
                    result = path.basename(vscode.workspace.workspaceFolders[0].uri.fsPath);
                } else {
                    result = undefined;
                    logger.debug("utils.getConfig - ${workspaceFolderBasename} used but no workspace folder set. Ignoring.");
                }
                break;
        }
        if (result === null) {
            logger.log(`utils.getConfig - unknown substition string "${match[0]}"`);
        } else if (result !== undefined) {
            logger.debug(`utils.getConfig - replaced "${match[0]}" by "${result}"`)
            input = input.replace(match[0], result);
        }
    }
    return input;
}

//!
//! Get values from the configuration (settings) file. This function is asynchronous and can return anything.
//! It supports a few substitution strings:
//!
//! - `${workspaceFolder}`
//! - `${workspaceFolderBasename}`
//! - `${env:name}`
//! - `${command:commandID}`
//!
//! If the substitution fails (we don't have workspace folders, the env var doesn't exists or whatever)
//! it's left as it is.
//!
export async function getConfig(category: string, key: string, def?: any): Promise< any | null > {
    logger.debug(`utils.getConfig - "${category}.${key}"`);

    // get the value
    let value = vscode.workspace.getConfiguration(category).get(key);

    // if not found, return the def
    if (value === undefined) {
        return def;
    }

    // replace variables
    if (typeof value === "string") {
        value = await handleSubstitution(value);
    } else if (Array.isArray(value)) {
        for (let i in value) {
            value[i] = await handleSubstitution(value[i]);
        }
    }

    // and done
    return value;
}

//!
//! Helper used to register a configuration change listener. This listener will be called once on registration
//! (so that it's initialized on startup) and then once whenever the configuration actually changes.
//!
export async function watchConfiguration(category: string, key: string, callback: (value: any) => any) {
    // call once
    callback(await getConfig(category, key));

    // and register  the configuration change
    const listener = new ConfigurationListener();
    listener.category = category;
    listener.key      = key;
    listener.section  = `${category}.${key}`;
    listener.callback = callback;
    configurationChangeListeners.push(listener);
}

//!
//! Register a function as a command
//!
export function registerCommand(command_id: string, command: (...args: any[]) => any): (...args: any[]) => any {
    logger.debug(`utils.registerCommand - "${command_id}"`);
    context.subscriptions.push(vscode.commands.registerCommand("clangd." + command_id, command));
    return command;
}
