/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */
import { AxiosAdapter, AxiosPromise, AxiosRequestConfig } from 'axios';
import { ICacheLike } from './utils/isCacheLike';
declare module 'axios' {
    interface AxiosRequestConfig {
        forceUpdate?: boolean;
        cache?: boolean | ICacheLike<any>;
    }
}
export type Options = {
    enabledByDefault?: boolean;
    cacheFlag?: string;
    defaultCache?: ICacheLike<AxiosPromise>;
    cacheKeyGenerator?: (config: AxiosRequestConfig, defaultCacheKey: string) => string;
};
export default function cacheAdapterEnhancer(adapter: AxiosAdapter, options?: Options): AxiosAdapter;
