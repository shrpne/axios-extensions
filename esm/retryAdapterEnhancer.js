/**
 * @author Kuitos
 * @since 2020-02-18
 */
import { __awaiter, __generator } from "tslib";
export default function retryAdapterEnhancer(adapter, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    var _a = options.times, times = _a === void 0 ? 2 : _a;
    return function (config) { return __awaiter(_this, void 0, void 0, function () {
        var _a, retryTimes, timeUp, count, request;
        var _this = this;
        return __generator(this, function (_b) {
            _a = config.retryTimes, retryTimes = _a === void 0 ? times : _a;
            timeUp = false;
            count = 0;
            request = function () { return __awaiter(_this, void 0, void 0, function () {
                var e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, adapter(config)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            e_1 = _a.sent();
                            timeUp = retryTimes === count;
                            if (timeUp) {
                                throw e_1;
                            }
                            count++;
                            /* istanbul ignore next */
                            if (process.env.LOGGER_LEVEL === 'info') {
                                console.info("[axios-extensions] request start retrying --> url: ".concat(config.url, " , time: ").concat(count));
                            }
                            return [2 /*return*/, request()];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            return [2 /*return*/, request()];
        });
    }); };
}
//# sourceMappingURL=retryAdapterEnhancer.js.map