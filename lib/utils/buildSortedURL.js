"use strict";
/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var axios_1 = tslib_1.__importDefault(require("axios"));
function buildSortedURL() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var url = args[0], params = args[1], paramsSerializer = args[2];
    var builtURL = axios_1.default.getUri({ url: url, params: params, paramsSerializer: paramsSerializer });
    var _a = builtURL.split('?'), urlPath = _a[0], queryString = _a[1];
    if (queryString) {
        var paramsPair = queryString.split('&');
        return "".concat(urlPath, "?").concat(paramsPair.sort().join('&'));
    }
    return builtURL;
}
exports.default = buildSortedURL;
//# sourceMappingURL=buildSortedURL.js.map