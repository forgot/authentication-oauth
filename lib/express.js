"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grant_1 = __importDefault(require("grant"));
const express_session_1 = __importDefault(require("express-session"));
const commons_1 = require("@feathersjs/commons");
const express_1 = require("@feathersjs/express");
const grantInstance = grant_1.default.express();
const debug = commons_1.createDebug('@feathersjs/authentication-oauth/express');
exports.default = (options) => {
    return (feathersApp) => {
        const { authService, linkStrategy } = options;
        const app = feathersApp;
        const config = app.get('grant');
        if (!config) {
            debug('No grant configuration found, skipping Express oAuth setup');
            return;
        }
        const { prefix } = config.defaults;
        const expressSession = options.expressSession || express_session_1.default({
            secret: Math.random().toString(36).substring(7),
            saveUninitialized: true,
            resave: true
        });
        const grantApp = grantInstance(config);
        const authApp = express_1.original();
        authApp.use(expressSession);
        authApp.get('/:name', (req, _res, next) => {
            const _a = req.query, { feathers_token, redirect } = _a, query = __rest(_a, ["feathers_token", "redirect"]);
            if (feathers_token) {
                debug('Got feathers_token query parameter to link accounts', feathers_token);
                req.session.accessToken = feathers_token;
            }
            req.session.redirect = redirect;
            req.session.query = query;
            next();
        });
        authApp.get('/:name/authenticate', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
            const { name } = req.params;
            const { accessToken, grant, query = {}, redirect } = req.session;
            const service = app.defaultAuthentication(authService);
            const [strategy] = service.getStrategies(name);
            const params = Object.assign(Object.assign({}, req.feathers), { authStrategies: [name], authentication: accessToken ? {
                    strategy: linkStrategy,
                    accessToken
                } : null, query,
                redirect });
            const sendResponse = (data) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const redirect = yield strategy.getRedirect(data, params);
                    if (redirect !== null) {
                        res.redirect(redirect);
                    }
                    else if (data instanceof Error) {
                        throw data;
                    }
                    else {
                        res.json(data);
                    }
                }
                catch (error) {
                    debug('oAuth error', error);
                    next(error);
                }
            });
            try {
                const payload = config.defaults.transport === 'session' ?
                    grant.response : req.query;
                const authentication = Object.assign({ strategy: name }, payload);
                yield new Promise((resolve, reject) => {
                    if (!req.session.destroy) {
                        req.session = null;
                        resolve();
                    }
                    req.session.destroy(err => err ? reject(err) : resolve());
                });
                debug(`Calling ${authService}.create authentication with strategy ${name}`);
                const authResult = yield service.create(authentication, params);
                debug('Successful oAuth authentication, sending response');
                yield sendResponse(authResult);
            }
            catch (error) {
                debug('Received oAuth authentication error', error.stack);
                yield sendResponse(error);
            }
        }));
        authApp.use(grantApp);
        app.set('grant', grantApp.config);
        app.use(prefix, authApp);
    };
};
//# sourceMappingURL=express.js.map