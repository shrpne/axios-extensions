/**
 * Created by Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2018/3/19 下午11:22
 */
import test from 'ava';
import isCacheLike from '../isCacheLike';
test('a object with specified method will be regard as cache', function (t) {
    var cache = {};
    t.is(isCacheLike(cache), false);
    cache = {
        // tslint:disable-next-line
        get: function () {
        },
        // tslint:disable-next-line
        set: function () {
        },
        // tslint:disable-next-line
        del: function () {
        },
    };
    t.is(isCacheLike(cache), true);
});
//# sourceMappingURL=test-isCacheLike.js.map