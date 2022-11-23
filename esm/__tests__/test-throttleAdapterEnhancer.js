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
import throttleAdapterEnhancer from '../throttleAdapterEnhancer';
var genMockAdapter = function (cb) { return function (config) {
    cb();
    if (config.error) {
        return Promise.reject(config);
    }
    return Promise.resolve(config);
}; };
test('throttle adapter should cache request in a threshold seconds', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var threshold, adapterCb, mockedAdapter, http, onSuccess, promises, start, i, end;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                threshold = 1000;
                adapterCb = spy();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios.create({
                    adapter: throttleAdapterEnhancer(mockedAdapter, { threshold: threshold }),
                });
                onSuccess = spy();
                promises = [];
                start = Date.now();
                for (i = 0; i < 5; i++) {
                    promises.push(http.get('/users').then(onSuccess));
                }
                return [4 /*yield*/, Promise.all(promises)];
            case 1:
                _a.sent();
                end = Date.now();
                t.is(onSuccess.callCount, 5);
                t.is(adapterCb.callCount, 1);
                t.is(adapterCb.calledBefore(onSuccess), true);
                t.is(end - start < threshold, true);
                return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, threshold); })];
            case 2:
                _a.sent();
                return [4 /*yield*/, Promise.all([
                        http.get('/users').then(onSuccess),
                        http.get('/users').then(onSuccess),
                    ])];
            case 3:
                _a.sent();
                t.is(onSuccess.callCount, 7);
                t.is(adapterCb.callCount, 2);
                return [2 /*return*/];
        }
    });
}); });
test('throttle adapter shouldn`t do anything when a non-get request invoked', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, http, onSuccess;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = spy();
                mockedAdapter = genMockAdapter(adapterCb);
                http = axios.create({
                    adapter: throttleAdapterEnhancer(mockedAdapter),
                });
                onSuccess = spy();
                return [4 /*yield*/, Promise.all([
                        http.post('/users').then(onSuccess),
                        http.post('/users').then(onSuccess),
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
                    adapter: throttleAdapterEnhancer(mockedAdapter),
                });
                onSuccess = spy();
                onError = spy();
                return [4 /*yield*/, Promise.all([
                        http.get('/users', { error: true }).then(onSuccess, onError),
                        http.get('/users').then(onSuccess, onError),
                    ])];
            case 1:
                _a.sent();
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
test('use a custom cache for throttle enhancer', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var adapterCb, mockedAdapter, cache, http, onSuccess;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                adapterCb = spy();
                mockedAdapter = genMockAdapter(adapterCb);
                cache = new LRUCache({ max: 100 });
                http = axios.create({
                    adapter: throttleAdapterEnhancer(mockedAdapter, { cache: cache }),
                });
                onSuccess = spy();
                return [4 /*yield*/, Promise.all([
                        http.get('/users').then(onSuccess),
                        http.get('/users').then(onSuccess),
                    ])];
            case 1:
                _a.sent();
                t.is(onSuccess.callCount, 2);
                t.is(adapterCb.callCount, 1);
                cache.delete('/users');
                return [4 /*yield*/, Promise.all([
                        http.get('/users').then(onSuccess),
                        http.get('/users').then(onSuccess),
                    ])];
            case 2:
                _a.sent();
                t.is(onSuccess.callCount, 4);
                t.is(adapterCb.callCount, 2);
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=test-throttleAdapterEnhancer.js.map