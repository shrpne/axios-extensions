/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-11
 */
import { AxiosAdapter, AxiosPromise } from 'axios';
import { ICacheLike } from './utils/isCacheLike';
export type RecordedCache = {
    timestamp: number;
    value?: AxiosPromise;
};
export type Options = {
    threshold?: number;
    cache?: ICacheLike<RecordedCache>;
};
export default function throttleAdapterEnhancer(adapter: AxiosAdapter, options?: Options): AxiosAdapter;
