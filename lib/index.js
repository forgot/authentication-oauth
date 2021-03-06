"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressOauth = exports.express = exports.setup = exports.OAuthStrategy = void 0;
const merge_1 = __importDefault(require("lodash/merge"));
const each_1 = __importDefault(require("lodash/each"));
const omit_1 = __importDefault(require("lodash/omit"));
const commons_1 = require("@feathersjs/commons");
const strategy_1 = require("./strategy");
Object.defineProperty(exports, "OAuthStrategy", { enumerable: true, get: function () { return strategy_1.OAuthStrategy; } });
const express_1 = __importDefault(require("./express"));
const utils_1 = require("./utils");
const debug = commons_1.createDebug('@feathersjs/authentication-oauth');
const setup = (options) => (app) => {
    const service = app.defaultAuthentication ? app.defaultAuthentication(options.authService) : null;
    if (!service) {
        throw new Error('An authentication service must exist before registering @feathersjs/authentication-oauth');
    }
    const { oauth } = service.configuration;
    if (!oauth) {
        debug('No oauth configuration found in authentication configuration. Skipping oAuth setup.');
        return;
    }
    const { strategyNames } = service;
    // Set up all the defaults
    const { prefix = '/oauth' } = oauth.defaults || {};
    const port = app.get('port');
    let host = app.get('host');
    let protocol = 'https';
    // Development environments commonly run on HTTP with an extended port
    if (app.get('env') === 'development') {
        protocol = 'http';
        if (String(port) !== '80') {
            host += `:${port}`;
        }
    }
    const grant = merge_1.default({
        defaults: {
            prefix,
            origin: `${protocol}://${host}`,
            transport: 'session',
            response: ['tokens', 'raw', 'profile']
        }
    }, omit_1.default(oauth, 'redirect'));
    const getUrl = (url) => {
        const { defaults } = grant;
        return `${defaults.origin}${prefix}/${url}`;
    };
    each_1.default(grant, (value, name) => {
        if (name !== 'defaults') {
            value.callback = value.callback || getUrl(`${name}/authenticate`);
            value.redirect_uri = value.redirect_uri || getUrl(`${name}/callback`);
            if (!strategyNames.includes(name)) {
                debug(`Registering oAuth default strategy for '${name}'`);
                service.register(name, new strategy_1.OAuthStrategy());
            }
        }
    });
    app.set('grant', grant);
};
exports.setup = setup;
const express = (settings = {}) => (app) => {
    const options = utils_1.getDefaultSettings(app, settings);
    app.configure(exports.setup(options));
    app.configure(express_1.default(options));
};
exports.express = express;
exports.expressOauth = exports.express;
//# sourceMappingURL=index.js.map