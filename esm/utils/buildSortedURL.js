/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */
import axios from 'axios';
export default function buildSortedURL() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var url = args[0], params = args[1], paramsSerializer = args[2];
    var builtURL = axios.getUri({ url: url, params: params, paramsSerializer: paramsSerializer });
    var _a = builtURL.split('?'), urlPath = _a[0], queryString = _a[1];
    if (queryString) {
        var paramsPair = queryString.split('&');
        return "".concat(urlPath, "?").concat(paramsPair.sort().join('&'));
    }
    return builtURL;
}
//# sourceMappingURL=buildSortedURL.js.map