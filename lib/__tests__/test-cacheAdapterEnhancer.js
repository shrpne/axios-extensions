"use strict";
/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-16
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ava_1 = tslib_1.__importDefault(require("ava"));
var axios_1 = tslib_1.__importDefault(require("axios"));
var lru_cache_1 = tslib_1.__importDefault(require("lru-cache"));
var sinon_1 = require("sinon");
var cacheAdapterEnhancer_1 = tslib_1.__importDefault(require("../cacheAdapterEnhancer"));
// mock the actual request
var genMockAdapter = function (cb) { return function (config) {
    cb();
    if (config.error) {
        return Promise.reject(config);
    }
    return Promise.resolve(config);
}; };
(0, ava_1.default)('cache adapter should cache request without noCacheFlag', function (t) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, onSuccess, promises, i;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = (0, sinon_1.spy)();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios_1.default.create({
                    adapter: (0, cacheAdapterEnhancer_1.default)(mockedAdapter, { enabledByDefault: true }),
                });
                onSuccess = (0, sinon_1.spy)();
                promises = [];
                for (i = 0; i < 5; i++) {
                    promises.push(http.get('/users').then(onSuccess));
                }
                return [4 /*yield*/, Promise.all(promises)];
            case 1:
                _a.sent();
                t.is(onSuccess.callCount, 5);
                t.is(adapterCb.callCount, 1);
                t.is(adapterCb.calledBefore(onSuccess), true);
                return [4 /*yield*/, http.get('/users', { params: { name: 'kuitos' } }).then(onSuccess)];
            case 2:
                _a.sent();
                t.is(onSuccess.callCount, 6);
                t.is(adapterCb.callCount, 2);
                return [4 /*yield*/, http.get('/users', { params: { name: 'kuitos' }, cache: true }).then(onSuccess)];
            case 3:
                _a.sent();
                t.is(onSuccess.callCount, 7);
                t.is(adapterCb.callCount, 2);
                return [2 /*return*/];
        }
    });
}); });
(0, ava_1.default)('cache adapter shouldn\'t cache request with noCacheFlag', function (t) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, onSuccess;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = (0, sinon_1.spy)();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios_1.default.create({
                    adapter: (0, cacheAdapterEnhancer_1.default)(mockedAdapter, { enabledByDefault: true, cacheFlag: 'cache' }),
                });
                onSuccess = (0, sinon_1.spy)();
                return [4 /*yield*/, Promise.all([
                        http.get('/users', { cache: false }).then(onSuccess),
                        http.get('/users', { cache: false }).then(onSuccess),
                    ])];
            case 1:
                _a.sent();
                t.is(onSuccess.callCount, 2);
                t.is(adapterCb.callCount, 2);
                return [2 /*return*/];
        }
    });
}); });
(0, ava_1.default)('cache will be removed when request error', function (t) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, onSuccess, onError;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = (0, sinon_1.spy)();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios_1.default.create({
                    adapter: (0, cacheAdapterEnhancer_1.default)(mockedAdapter, { enabledByDefault: true }),
                });
                onSuccess = (0, sinon_1.spy)();
                onError = (0, sinon_1.spy)();
                return [4 /*yield*/, Promise.all([
                        http.get('/users', { error: true }).then(onSuccess, onError),
                        http.get('/users').then(onSuccess, onError),
                    ])];
            case 1:
                _a.sent();
                // as the previous uses invocation failed, the following users request will respond with the rejected promise
                t.is(onSuccess.callCount, 0);
                t.is(onError.callCount, 2);
                t.is(adapterCb.callCount, 1);
                return [4 /*yield*/, Promise.all([
                        http.get('/users').then(onSuccess, onError),
                        http.get('/users').then(onSuccess, onError),
                    ])];
            case 2:
                _a.sent();
                t.is(onSuccess.callCount, 2);
                t.is(adapterCb.callCount, 2);
                return [2 /*return*/];
        }
    });
}); });
(0, ava_1.default)('disable default cache switcher', function (t) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, onSuccess;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = (0, sinon_1.spy)();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios_1.default.create({
                    adapter: (0, cacheAdapterEnhancer_1.default)(mockedAdapter),
                });
                onSuccess = (0, sinon_1.spy)();
                return [4 /*yield*/, Promise.all([
                        http.get('/users').then(onSuccess),
                        http.get('/users').then(onSuccess),
                        http.get('/users', { cache: false }).then(onSuccess),
                    ])];
            case 1:
                _a.sent();
                t.is(onSuccess.callCount, 3);
                t.is(adapterCb.callCount, 2);
                return [2 /*return*/];
        }
    });
}); });
(0, ava_1.default)('request will refresh the cache with forceUpdate config', function (t) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, cache, http, onSuccess, responed1, responed2;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = (0, sinon_1.spy)();
                mockedAdapter = genMockAdapter(adapterCb);
                cache = new lru_cache_1.default({ max: 100 });
                http = axios_1.default.create({
                    adapter: (0, cacheAdapterEnhancer_1.default)(mockedAdapter, { enabledByDefault: true, cacheFlag: 'cache', defaultCache: cache }),
                });
                onSuccess = (0, sinon_1.spy)();
                return [4 /*yield*/, http.get('/users').then(onSuccess)];
            case 1:
                _a.sent();
                return [4 /*yield*/, cache.get('/users')];
            case 2:
                responed1 = _a.sent();
                return [4 /*yield*/, http.get('/users', { forceUpdate: true }).then(onSuccess)];
            case 3:
                _a.sent();
                return [4 /*yield*/, cache.get('/users')];
            case 4:
                responed2 = _a.sent();
                t.is(adapterCb.callCount, 2);
                t.is(onSuccess.callCount, 2);
                if (responed1) {
                    t.is(responed1.url, '/users');
                    t.is(responed1.url, responed2.url);
                }
                t.not(responed1, responed2);
                return [2 /*return*/];
        }
    });
}); });
(0, ava_1.default)('use a custom cache with request individual config', function (t) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, cache1, cache2;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = (0, sinon_1.spy)();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios_1.default.create({
                    adapter: (0, cacheAdapterEnhancer_1.default)(mockedAdapter),
                });
                cache1 = new lru_cache_1.default({ max: 100 });
                cache2 = new lru_cache_1.default({ max: 100 });
                return [4 /*yield*/, Promise.all([http.get('/users', { cache: cache1 }), http.get('/users', { cache: cache2 })])];
            case 1:
                _a.sent();
                t.is(adapterCb.callCount, 2);
                cache2.clear();
                return [4 /*yield*/, Promise.all([http.get('/users', { cache: cache1 }), http.get('/users', { cache: cache2 })])];
            case 2:
                _a.sent();
                t.is(adapterCb.callCount, 3);
                return [2 /*return*/];
        }
    });
}); });
(0, ava_1.default)('custom cache key will produce two different requests', function (t) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, onSuccess;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = (0, sinon_1.spy)();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios_1.default.create({
                    adapter: (0, cacheAdapterEnhancer_1.default)(mockedAdapter, {
                        cacheKeyGenerator: function (config, defaultCacheKey) {
                            var _a;
                            return defaultCacheKey + (((_a = config.headers) === null || _a === void 0 ? void 0 : _a.Authorization) || '');
                        },
                    }),
                });
                onSuccess = (0, sinon_1.spy)();
                return [4 /*yield*/, http.get('/users', { headers: { Authorization: 'test1' } }).then(onSuccess)];
            case 1:
                _a.sent();
                return [4 /*yield*/, http.get('/users', { headers: { Authorization: 'test1' } }).then(onSuccess)];
            case 2:
                _a.sent();
                return [4 /*yield*/, http.get('/users', { headers: { Authorization: 'test2' } }).then(onSuccess)];
            case 3:
                _a.sent();
                t.is(adapterCb.callCount, 2);
                t.is(onSuccess.callCount, 3);
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=test-cacheAdapterEnhancer.js.map