/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-17
 */
import test from 'ava';
import buildSortedURL from '../buildSortedURL';
test('build a simple url without params', function (t) {
    var url = '//cross-domain.test/users';
    var params = {};
    var builtUrl = buildSortedURL(url, params);
    t.is(builtUrl, "".concat(url));
});
test('build a simple url with params', function (t) {
    var url = '//cross-domain.test/users';
    var params = { name: 'kuitos', age: 18 };
    var builtUrl = buildSortedURL(url, params);
    t.is(builtUrl, "".concat(url, "?age=18&name=kuitos"));
});
test('build a url which already had a query string with params', function (t) {
    var url = '//cross-domain.test/users?title=genius';
    var params = { name: 'kuitos', age: 18 };
    var builtUrl = buildSortedURL(url, params);
    t.is(builtUrl, '//cross-domain.test/users?age=18&name=kuitos&title=genius');
});
//# sourceMappingURL=test-buildSortedURL.js.map