"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PlatformTools_1 = require("../../platform/PlatformTools");
var globalScope = PlatformTools_1.PlatformTools.getGlobalVariable();
var getRandomBytes = ((typeof globalScope !== 'undefined' && (globalScope.crypto || globalScope.msCrypto))
    ? function () {
        var crypto = (globalScope.crypto || globalScope.msCrypto), QUOTA = 65536;
        return function (n) {
            var a = new Uint8Array(n);
            for (var i = 0; i < n; i += QUOTA) {
                crypto.getRandomValues(a.subarray(i, i + Math.min(n - i, QUOTA)));
            }
            return a;
        };
    }
    : function () {
        return require("crypto").randomBytes;
    })();
var SpannerUtil = /** @class */ (function () {
    function SpannerUtil() {
    }
    SpannerUtil.randomBytes = function (size) {
        return getRandomBytes(size);
    };
    return SpannerUtil;
}());
exports.SpannerUtil = SpannerUtil;

//# sourceMappingURL=SpannerUtil.js.map
