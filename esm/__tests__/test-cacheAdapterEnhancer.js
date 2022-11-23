/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-16
 */
import { __awaiter, __generator } from "tslib";
import test from 'ava';
import axios from 'axios';
import LRUCache from 'lru-cache';
import { spy } from 'sinon';
import cacheAdapterEnhancer from '../cacheAdapterEnhancer';
// mock the actual request
var genMockAdapter = function (cb) { return function (config) {
    cb();
    if (config.error) {
        return Promise.reject(config);
    }
    return Promise.resolve(config);
}; };
test('cache adapter should cache request without noCacheFlag', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, onSuccess, promises, i;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = spy();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios.create({
                    adapter: cacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true }),
                });
                onSuccess = spy();
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
test('cache adapter shouldn\'t cache request with noCacheFlag', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, onSuccess;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = spy();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios.create({
                    adapter: cacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true, cacheFlag: 'cache' }),
                });
                onSuccess = spy();
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
test('cache will be removed when request error', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, onSuccess, onError;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = spy();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios.create({
                    adapter: cacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true }),
                });
                onSuccess = spy();
                onError = spy();
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
test('disable default cache switcher', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, onSuccess;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = spy();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios.create({
                    adapter: cacheAdapterEnhancer(mockedAdapter),
                });
                onSuccess = spy();
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
test('request will refresh the cache with forceUpdate config', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, cache, http, onSuccess, responed1, responed2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = spy();
                mockedAdapter = genMockAdapter(adapterCb);
                cache = new LRUCache({ max: 100 });
                http = axios.create({
                    adapter: cacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true, cacheFlag: 'cache', defaultCache: cache }),
                });
                onSuccess = spy();
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
test('use a custom cache with request individual config', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, cache1, cache2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = spy();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios.create({
                    adapter: cacheAdapterEnhancer(mockedAdapter),
                });
                cache1 = new LRUCache({ max: 100 });
                cache2 = new LRUCache({ max: 100 });
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
test('custom cache key will produce two different requests', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, onSuccess;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = spy();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios.create({
                    adapter: cacheAdapterEnhancer(mockedAdapter, {
                        cacheKeyGenerator: function (config, defaultCacheKey) {
                            var _a;
                            return defaultCacheKey + (((_a = config.headers) === null || _a === void 0 ? void 0 : _a.Authorization) || '');
                        },
                    }),
                });
                onSuccess = spy();
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