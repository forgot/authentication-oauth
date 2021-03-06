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
exports.OAuthStrategy = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-ignore
const querystring_1 = __importDefault(require("querystring"));
const authentication_1 = require("@feathersjs/authentication");
const errors_1 = require("@feathersjs/errors");
const commons_1 = require("@feathersjs/commons");
const debug = commons_1.createDebug('@feathersjs/authentication-oauth/strategy');
class OAuthStrategy extends authentication_1.AuthenticationBaseStrategy {
    get configuration() {
        const { entity, service, entityId, oauth } = this.authentication.configuration;
        const config = oauth[this.name];
        return Object.assign({ entity,
            service,
            entityId }, config);
    }
    get entityId() {
        const { entityService } = this;
        return this.configuration.entityId || (entityService && entityService.id);
    }
    getEntityQuery(profile, _params) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                [`${this.name}Id`]: profile.sub || profile.id
            };
        });
    }
    getEntityData(profile, _existingEntity, _params) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                [`${this.name}Id`]: profile.sub || profile.id
            };
        });
    }
    getProfile(data, _params) {
        return __awaiter(this, void 0, void 0, function* () {
            return data.profile;
        });
    }
    getCurrentEntity(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { authentication } = params;
            const { entity } = this.configuration;
            if (authentication && authentication.strategy) {
                debug('getCurrentEntity with authentication', authentication);
                const { strategy } = authentication;
                const authResult = yield this.authentication
                    .authenticate(authentication, params, strategy);
                return authResult[entity];
            }
            return null;
        });
    }
    getRedirect(data, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryRedirect = (params && params.redirect) || '';
            const { redirect } = this.authentication.configuration.oauth;
            if (!redirect) {
                return null;
            }
            const redirectUrl = `${redirect}${queryRedirect}`;
            const separator = redirect.endsWith('?') ? '' :
                (redirect.indexOf('#') !== -1 ? '?' : '#');
            const authResult = data;
            const query = authResult.accessToken ? {
                access_token: authResult.accessToken
            } : {
                error: data.message || 'OAuth Authentication not successful'
            };
            return `${redirectUrl}${separator}${querystring_1.default.stringify(query)}`;
        });
    }
    findEntity(profile, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = yield this.getEntityQuery(profile, params);
            debug('findEntity with query', query);
            const result = yield this.entityService.find(Object.assign(Object.assign({}, params), { query }));
            const [entity = null] = result.data ? result.data : result;
            debug('findEntity returning', entity);
            return entity;
        });
    }
    createEntity(profile, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getEntityData(profile, null, params);
            debug('createEntity with data', data);
            return this.entityService.create(data, params);
        });
    }
    updateEntity(entity, profile, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = entity[this.entityId];
            const data = yield this.getEntityData(profile, entity, params);
            debug(`updateEntity with id ${id} and data`, data);
            return this.entityService.patch(id, data, params);
        });
    }
    getEntity(result, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { entityService } = this;
            const { entityId = entityService.id, entity } = this.configuration;
            if (!entityId || result[entityId] === undefined) {
                throw new errors_1.NotAuthenticated('Could not get oAuth entity');
            }
            if (!params.provider) {
                return result;
            }
            return entityService.get(result[entityId], Object.assign(Object.assign({}, params), { [entity]: result }));
        });
    }
    authenticate(authentication, originalParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const entity = this.configuration.entity;
            const { provider } = originalParams, params = __rest(originalParams, ["provider"]);
            const profile = yield this.getProfile(authentication, params);
            const existingEntity = (yield this.findEntity(profile, params))
                || (yield this.getCurrentEntity(params));
            debug('authenticate with (existing) entity', existingEntity);
            const authEntity = !existingEntity ? yield this.createEntity(profile, params)
                : yield this.updateEntity(existingEntity, profile, params);
            return {
                authentication: { strategy: this.name },
                [entity]: yield this.getEntity(authEntity, originalParams)
            };
        });
    }
}
exports.OAuthStrategy = OAuthStrategy;
//# sourceMappingURL=strategy.js.map