"use strict";
/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-11
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var lru_cache_1 = tslib_1.__importDefault(require("lru-cache"));
var buildSortedURL_1 = tslib_1.__importDefault(require("./utils/buildSortedURL"));
function throttleAdapterEnhancer(adapter, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    var _a = options.threshold, threshold = _a === void 0 ? 1000 : _a, _b = options.cache, cache = _b === void 0 ? new lru_cache_1.default({ max: 10 }) : _b;
    var recordCacheWithRequest = function (index, config) {
        var responsePromise = (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var response, reason_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, adapter(config)];
                    case 1:
                        response = _a.sent();
                        cache.set(index, {
                            timestamp: Date.now(),
                            value: Promise.resolve(response),
                        });
                        return [2 /*return*/, response];
                    case 2:
                        reason_1 = _a.sent();
                        'delete' in cache ? cache.delete(index) : cache.del(index);
                        throw reason_1;
                    case 3: return [2 /*return*/];
                }
            });
        }); })();
        cache.set(index, {
            timestamp: Date.now(),
            value: responsePromise,
        });
        return responsePromise;
    };
    return function (config) {
        var url = config.url, method = config.method, params = config.params, paramsSerializer = config.paramsSerializer;
        var index = (0, buildSortedURL_1.default)(url, params, paramsSerializer);
        var now = Date.now();
        var cachedRecord = cache.get(index) || { timestamp: now };
        if (method === 'get') {
            if (now - cachedRecord.timestamp <= threshold) {
                var responsePromise = cachedRecord.value;
                if (responsePromise) {
                    /* istanbul ignore next */
                    if (process.env.LOGGER_LEVEL === 'info') {
                        // eslint-disable-next-line no-console
                        console.info("[axios-extensions] request cached by throttle adapter --> url: ".concat(index));
                    }
                    return responsePromise;
                }
            }
            return recordCacheWithRequest(index, config);
        }
        return adapter(config);
    };
}
exports.default = throttleAdapterEnhancer;
//# sourceMappingURL=throttleAdapterEnhancer.js.map