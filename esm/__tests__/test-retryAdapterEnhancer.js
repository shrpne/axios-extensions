/**
 * @author Kuitos
 * @since 2020-02-18
 */
import { __awaiter, __generator } from "tslib";
import test from 'ava';
import axios from 'axios';
import { spy } from 'sinon';
import retryAdapterEnhancer from '../retryAdapterEnhancer';
test('should retry the request with special times while request failed', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var times, spyFn, mockedAdapter, http;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                times = 3;
                spyFn = spy();
                mockedAdapter = function (config) {
                    spyFn();
                    if (spyFn.callCount === times + 1) {
                        return Promise.resolve(config);
                    }
                    return Promise.reject(config);
                };
                http = axios.create({
                    adapter: retryAdapterEnhancer(mockedAdapter, { times: times }),
                });
                return [4 /*yield*/, http.get('/test')];
            case 1:
                _a.sent();
                t.is(spyFn.callCount, times + 1);
                return [2 /*return*/];
        }
    });
}); });
test('should return the result immediately while the request succeed', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var spyFn, mockedAdapter, http;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                spyFn = spy();
                mockedAdapter = function (config) {
                    spyFn();
                    if (spyFn.calledTwice) {
                        return Promise.resolve(config);
                    }
                    return Promise.reject(config);
                };
                http = axios.create({
                    adapter: retryAdapterEnhancer(mockedAdapter),
                });
                return [4 /*yield*/, http.get('/test')];
            case 1:
                _a.sent();
                t.truthy(spyFn.calledTwice);
                return [2 /*return*/];
        }
    });
}); });
test('should throw an exception while request still failed after retry', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var defaultTimes, spyFn, mockedAdapter, http, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                defaultTimes = 2;
                spyFn = spy();
                mockedAdapter = function (config) {
                    spyFn();
                    return Promise.reject(config);
                };
                http = axios.create({
                    adapter: retryAdapterEnhancer(mockedAdapter),
                });
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, http.get('/test')];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                t.is(e_1.url, '/test');
                t.is(spyFn.callCount, defaultTimes + 1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('should retry with special times for the custom config request', function (t) { return __awaiter(void 0, void 0, void 0, function () {
    var spyFn, mockedAdapter, http, customRetryTimes, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                spyFn = spy();
                mockedAdapter = function (config) {
                    spyFn();
                    return Promise.reject(config);
                };
                http = axios.create({
                    adapter: retryAdapterEnhancer(mockedAdapter, { times: 2 }),
                });
                customRetryTimes = 4;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, http.get('/test', { retryTimes: customRetryTimes })];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_2 = _a.sent();
                t.is(e_2.url, '/test');
                t.is(spyFn.callCount, customRetryTimes + 1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=test-retryAdapterEnhancer.js.map