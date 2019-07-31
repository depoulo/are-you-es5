#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const babel_loader_regex_builder_1 = require("./babel-loader-regex-builder");
const modules_checker_1 = require("./modules-checker");
commander_1.default
    .version('1.2.1')
    .command('check <path>')
    .description('Checks if all node_modules (direct dependencies only) at <path> are ES5')
    .option('-a, --all', 'Check all node_modules instead of just direct dependencies')
    .option('-v, --verbose', 'Log all messages (including modules that are ES5)')
    .option('-r, --regex', 'Get babel-loader exclude regex to ignore all node_modules except non-ES5 ones')
    .action((path, cmd) => {
    const config = {
        checkAllNodeModules: cmd.all === true,
        logEs5Packages: cmd.verbose === true
    };
    const checker = new modules_checker_1.ModulesChecker(path, config);
    const nonEs5Dependencies = checker.checkModules();
    if (cmd.regex) {
        console.log('\n\nBabel-loader exclude regex:');
        console.log('(You should manually remove Webpack and Babel plugins from this regex)\n');
        console.log(babel_loader_regex_builder_1.getBabelLoaderIgnoreRegex(nonEs5Dependencies));
    }
});
commander_1.default.parse(process.argv);
//# sourceMappingURL=index.js.map