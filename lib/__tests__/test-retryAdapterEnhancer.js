"use strict";
/**
 * @author Kuitos
 * @since 2020-02-18
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ava_1 = tslib_1.__importDefault(require("ava"));
var axios_1 = tslib_1.__importDefault(require("axios"));
var sinon_1 = require("sinon");
var retryAdapterEnhancer_1 = tslib_1.__importDefault(require("../retryAdapterEnhancer"));
(0, ava_1.default)('should retry the request with special times while request failed', function (t) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var times, spyFn, mockedAdapter, http;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                times = 3;
                spyFn = (0, sinon_1.spy)();
                mockedAdapter = function (config) {
                    spyFn();
                    if (spyFn.callCount === times + 1) {
                        return Promise.resolve(config);
                    }
                    return Promise.reject(config);
                };
                http = axios_1.default.create({
                    adapter: (0, retryAdapterEnhancer_1.default)(mockedAdapter, { times: times }),
                });
                return [4 /*yield*/, http.get('/test')];
            case 1:
                _a.sent();
                t.is(spyFn.callCount, times + 1);
                return [2 /*return*/];
        }
    });
}); });
(0, ava_1.default)('should return the result immediately while the request succeed', function (t) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var spyFn, mockedAdapter, http;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                spyFn = (0, sinon_1.spy)();
                mockedAdapter = function (config) {
                    spyFn();
                    if (spyFn.calledTwice) {
                        return Promise.resolve(config);
                    }
                    return Promise.reject(config);
                };
                http = axios_1.default.create({
                    adapter: (0, retryAdapterEnhancer_1.default)(mockedAdapter),
                });
                return [4 /*yield*/, http.get('/test')];
            case 1:
                _a.sent();
                t.truthy(spyFn.calledTwice);
                return [2 /*return*/];
        }
    });
}); });
(0, ava_1.default)('should throw an exception while request still failed after retry', function (t) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var defaultTimes, spyFn, mockedAdapter, http, e_1;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                defaultTimes = 2;
                spyFn = (0, sinon_1.spy)();
                mockedAdapter = function (config) {
                    spyFn();
                    return Promise.reject(config);
                };
                http = axios_1.default.create({
                    adapter: (0, retryAdapterEnhancer_1.default)(mockedAdapter),
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
(0, ava_1.default)('should retry with special times for the custom config request', function (t) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var spyFn, mockedAdapter, http, customRetryTimes, e_2;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                spyFn = (0, sinon_1.spy)();
                mockedAdapter = function (config) {
                    spyFn();
                    return Promise.reject(config);
                };
                http = axios_1.default.create({
                    adapter: (0, retryAdapterEnhancer_1.default)(mockedAdapter, { times: 2 }),
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