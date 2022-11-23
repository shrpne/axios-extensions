"use strict";
/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-09-28
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryAdapterEnhancer = exports.throttleAdapterEnhancer = exports.cacheAdapterEnhancer = exports.Cache = void 0;
var tslib_1 = require("tslib");
var lru_cache_1 = tslib_1.__importDefault(require("lru-cache"));
exports.Cache = lru_cache_1.default;
var cacheAdapterEnhancer_1 = tslib_1.__importDefault(require("./cacheAdapterEnhancer"));
exports.cacheAdapterEnhancer = cacheAdapterEnhancer_1.default;
var retryAdapterEnhancer_1 = tslib_1.__importDefault(require("./retryAdapterEnhancer"));
exports.retryAdapterEnhancer = retryAdapterEnhancer_1.default;
var throttleAdapterEnhancer_1 = tslib_1.__importDefault(require("./throttleAdapterEnhancer"));
exports.throttleAdapterEnhancer = throttleAdapterEnhancer_1.default;
//# sourceMappingURL=index.js.map