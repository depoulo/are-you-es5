"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const acorn = __importStar(require("acorn"));
const array_flatten_1 = __importDefault(require("array-flatten"));
const fs_1 = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
class ModulesChecker {
    constructor(dir, config = ModulesChecker.defaultConfig) {
        this.dir = dir;
        this.config = config;
        this.dir = path_1.default.resolve(dir);
        this.config = Object.assign({}, ModulesChecker.defaultConfig, config);
    }
    checkModules() {
        const dependencies = this.getDeps();
        if (!dependencies) {
            return [];
        }
        const nonEs5Dependencies = [];
        dependencies.forEach(dependency => {
            try {
                const dependencyIsEs5 = this.isScriptEs5(require.resolve(dependency, { paths: [this.dir] }), dependency);
                if (!dependencyIsEs5) {
                    nonEs5Dependencies.push(dependency);
                }
            }
            catch (err) {
                console.log(`⚠️ ${dependency} was not checked because no entry script was found`);
            }
        });
        return nonEs5Dependencies;
    }
    getDeps() {
        const deps = this.getDepsFromRootPackageJson();
        if (this.config.checkAllNodeModules) {
            deps.push(...this.getAllNodeModules());
        }
        // convert to and from a Set to remove duplicates
        return [...new Set(deps)].sort();
    }
    isScriptEs5(scriptPath, dependencyName) {
        // TODO: Check all scripts this script requires/imports
        const acornOpts = { ecmaVersion: 5 };
        const code = fs_1.default.readFileSync(scriptPath, 'utf8');
        try {
            acorn.parse(code, acornOpts);
        }
        catch (err) {
            console.log(`❌ ${dependencyName} is not ES5`);
            return false;
        }
        if (this.config.logEs5Packages) {
            console.log(`✅ ${dependencyName} is ES5`);
        }
        return true;
    }
    getDepsFromRootPackageJson() {
        const packageJsonPath = path_1.default.join(this.dir, 'package.json');
        const packageJson = require(packageJsonPath);
        if (!packageJson) {
            console.error(`Failed to load package.json in ${this.dir}`);
            return null;
        }
        return Object.keys(packageJson.dependencies);
    }
    getAllNodeModules() {
        const nodeModulesPath = path_1.default.join(this.dir, 'node_modules');
        if (fs_1.default.existsSync(nodeModulesPath)) {
            const isDirectory = (source) => fs_1.lstatSync(source).isDirectory();
            const getDirectories = (source) => {
                return fs_1.default
                    .readdirSync(source)
                    .map(name => path_1.default.join(source, name))
                    .filter(isDirectory);
            };
            const getLeafFolderName = (fullPath) => {
                const needle = 'node_modules/';
                const indexOfLastSlash = fullPath.lastIndexOf(needle);
                return fullPath.substr(indexOfLastSlash + needle.length);
            };
            let nodeModules = getDirectories(nodeModulesPath)
                .filter(entry => {
                const leafFolderName = getLeafFolderName(entry);
                return !leafFolderName.startsWith('.');
            })
                .map(entry => {
                // If this is a scope (folder starts with @), return all
                // folders inside it (scoped packages)
                if (/@.*$/.test(entry)) {
                    return getDirectories(entry);
                }
                else {
                    return entry;
                }
            });
            // Remove path from all strings
            // e.g. turn bla/bla/node_modules/@babel/core
            // into @babel/core
            nodeModules = array_flatten_1.default(nodeModules).map((entry) => getLeafFolderName(entry));
            return nodeModules;
        }
        console.error(`Failed to find node_modules at ${this.dir}`);
        return null;
    }
}
ModulesChecker.defaultConfig = {
    logEs5Packages: false
};
exports.ModulesChecker = ModulesChecker;
//# sourceMappingURL=modules-checker.js.map