(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('axios')) :
  typeof define === 'function' && define.amd ? define(['exports', 'axios'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["axios-extensions"] = {}, global.axios));
})(this, (function (exports, axios) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);

  const perf =
    typeof performance === 'object' &&
    performance &&
    typeof performance.now === 'function'
      ? performance
      : Date;

  const hasAbortController = typeof AbortController === 'function';

  // minimal backwards-compatibility polyfill
  // this doesn't have nearly all the checks and whatnot that
  // actual AbortController/Signal has, but it's enough for
  // our purposes, and if used properly, behaves the same.
  const AC = hasAbortController
    ? AbortController
    : class AbortController {
        constructor() {
          this.signal = new AS();
        }
        abort(reason = new Error('This operation was aborted')) {
          this.signal.reason = this.signal.reason || reason;
          this.signal.aborted = true;
          this.signal.dispatchEvent({
            type: 'abort',
            target: this.signal,
          });
        }
      };

  const hasAbortSignal = typeof AbortSignal === 'function';
  // Some polyfills put this on the AC class, not global
  const hasACAbortSignal = typeof AC.AbortSignal === 'function';
  const AS = hasAbortSignal
    ? AbortSignal
    : hasACAbortSignal
    ? AC.AbortController
    : class AbortSignal {
        constructor() {
          this.reason = undefined;
          this.aborted = false;
          this._listeners = [];
        }
        dispatchEvent(e) {
          if (e.type === 'abort') {
            this.aborted = true;
            this.onabort(e);
            this._listeners.forEach(f => f(e), this);
          }
        }
        onabort() {}
        addEventListener(ev, fn) {
          if (ev === 'abort') {
            this._listeners.push(fn);
          }
        }
        removeEventListener(ev, fn) {
          if (ev === 'abort') {
            this._listeners = this._listeners.filter(f => f !== fn);
          }
        }
      };

  const warned = new Set();
  const deprecatedOption = (opt, instead) => {
    const code = `LRU_CACHE_OPTION_${opt}`;
    if (shouldWarn(code)) {
      warn(code, `${opt} option`, `options.${instead}`, LRUCache);
    }
  };
  const deprecatedMethod = (method, instead) => {
    const code = `LRU_CACHE_METHOD_${method}`;
    if (shouldWarn(code)) {
      const { prototype } = LRUCache;
      const { get } = Object.getOwnPropertyDescriptor(prototype, method);
      warn(code, `${method} method`, `cache.${instead}()`, get);
    }
  };
  const deprecatedProperty = (field, instead) => {
    const code = `LRU_CACHE_PROPERTY_${field}`;
    if (shouldWarn(code)) {
      const { prototype } = LRUCache;
      const { get } = Object.getOwnPropertyDescriptor(prototype, field);
      warn(code, `${field} property`, `cache.${instead}`, get);
    }
  };

  const emitWarning = (...a) => {
    typeof process === 'object' &&
    process &&
    typeof process.emitWarning === 'function'
      ? process.emitWarning(...a)
      : console.error(...a);
  };

  const shouldWarn = code => !warned.has(code);

  const warn = (code, what, instead, fn) => {
    warned.add(code);
    const msg = `The ${what} is deprecated. Please use ${instead} instead.`;
    emitWarning(msg, 'DeprecationWarning', code, fn);
  };

  const isPosInt = n => n && n === Math.floor(n) && n > 0 && isFinite(n);

  /* istanbul ignore next - This is a little bit ridiculous, tbh.
   * The maximum array length is 2^32-1 or thereabouts on most JS impls.
   * And well before that point, you're caching the entire world, I mean,
   * that's ~32GB of just integers for the next/prev links, plus whatever
   * else to hold that many keys and values.  Just filling the memory with
   * zeroes at init time is brutal when you get that big.
   * But why not be complete?
   * Maybe in the future, these limits will have expanded. */
  const getUintArray = max =>
    !isPosInt(max)
      ? null
      : max <= Math.pow(2, 8)
      ? Uint8Array
      : max <= Math.pow(2, 16)
      ? Uint16Array
      : max <= Math.pow(2, 32)
      ? Uint32Array
      : max <= Number.MAX_SAFE_INTEGER
      ? ZeroArray
      : null;

  class ZeroArray extends Array {
    constructor(size) {
      super(size);
      this.fill(0);
    }
  }

  class Stack {
    constructor(max) {
      if (max === 0) {
        return []
      }
      const UintArray = getUintArray(max);
      this.heap = new UintArray(max);
      this.length = 0;
    }
    push(n) {
      this.heap[this.length++] = n;
    }
    pop() {
      return this.heap[--this.length]
    }
  }

  class LRUCache {
    constructor(options = {}) {
      const {
        max = 0,
        ttl,
        ttlResolution = 1,
        ttlAutopurge,
        updateAgeOnGet,
        updateAgeOnHas,
        allowStale,
        dispose,
        disposeAfter,
        noDisposeOnSet,
        noUpdateTTL,
        maxSize = 0,
        maxEntrySize = 0,
        sizeCalculation,
        fetchMethod,
        fetchContext,
        noDeleteOnFetchRejection,
        noDeleteOnStaleGet,
        allowStaleOnFetchRejection,
        allowStaleOnFetchAbort,
        ignoreFetchAbort,
      } = options;

      // deprecated options, don't trigger a warning for getting them if
      // the thing being passed in is another LRUCache we're copying.
      const { length, maxAge, stale } =
        options instanceof LRUCache ? {} : options;

      if (max !== 0 && !isPosInt(max)) {
        throw new TypeError('max option must be a nonnegative integer')
      }

      const UintArray = max ? getUintArray(max) : Array;
      if (!UintArray) {
        throw new Error('invalid max value: ' + max)
      }

      this.max = max;
      this.maxSize = maxSize;
      this.maxEntrySize = maxEntrySize || this.maxSize;
      this.sizeCalculation = sizeCalculation || length;
      if (this.sizeCalculation) {
        if (!this.maxSize && !this.maxEntrySize) {
          throw new TypeError(
            'cannot set sizeCalculation without setting maxSize or maxEntrySize'
          )
        }
        if (typeof this.sizeCalculation !== 'function') {
          throw new TypeError('sizeCalculation set to non-function')
        }
      }

      this.fetchMethod = fetchMethod || null;
      if (this.fetchMethod && typeof this.fetchMethod !== 'function') {
        throw new TypeError(
          'fetchMethod must be a function if specified'
        )
      }

      this.fetchContext = fetchContext;
      if (!this.fetchMethod && fetchContext !== undefined) {
        throw new TypeError(
          'cannot set fetchContext without fetchMethod'
        )
      }

      this.keyMap = new Map();
      this.keyList = new Array(max).fill(null);
      this.valList = new Array(max).fill(null);
      this.next = new UintArray(max);
      this.prev = new UintArray(max);
      this.head = 0;
      this.tail = 0;
      this.free = new Stack(max);
      this.initialFill = 1;
      this.size = 0;

      if (typeof dispose === 'function') {
        this.dispose = dispose;
      }
      if (typeof disposeAfter === 'function') {
        this.disposeAfter = disposeAfter;
        this.disposed = [];
      } else {
        this.disposeAfter = null;
        this.disposed = null;
      }
      this.noDisposeOnSet = !!noDisposeOnSet;
      this.noUpdateTTL = !!noUpdateTTL;
      this.noDeleteOnFetchRejection = !!noDeleteOnFetchRejection;
      this.allowStaleOnFetchRejection = !!allowStaleOnFetchRejection;
      this.allowStaleOnFetchAbort = !!allowStaleOnFetchAbort;
      this.ignoreFetchAbort = !!ignoreFetchAbort;

      // NB: maxEntrySize is set to maxSize if it's set
      if (this.maxEntrySize !== 0) {
        if (this.maxSize !== 0) {
          if (!isPosInt(this.maxSize)) {
            throw new TypeError(
              'maxSize must be a positive integer if specified'
            )
          }
        }
        if (!isPosInt(this.maxEntrySize)) {
          throw new TypeError(
            'maxEntrySize must be a positive integer if specified'
          )
        }
        this.initializeSizeTracking();
      }

      this.allowStale = !!allowStale || !!stale;
      this.noDeleteOnStaleGet = !!noDeleteOnStaleGet;
      this.updateAgeOnGet = !!updateAgeOnGet;
      this.updateAgeOnHas = !!updateAgeOnHas;
      this.ttlResolution =
        isPosInt(ttlResolution) || ttlResolution === 0
          ? ttlResolution
          : 1;
      this.ttlAutopurge = !!ttlAutopurge;
      this.ttl = ttl || maxAge || 0;
      if (this.ttl) {
        if (!isPosInt(this.ttl)) {
          throw new TypeError(
            'ttl must be a positive integer if specified'
          )
        }
        this.initializeTTLTracking();
      }

      // do not allow completely unbounded caches
      if (this.max === 0 && this.ttl === 0 && this.maxSize === 0) {
        throw new TypeError(
          'At least one of max, maxSize, or ttl is required'
        )
      }
      if (!this.ttlAutopurge && !this.max && !this.maxSize) {
        const code = 'LRU_CACHE_UNBOUNDED';
        if (shouldWarn(code)) {
          warned.add(code);
          const msg =
            'TTL caching without ttlAutopurge, max, or maxSize can ' +
            'result in unbounded memory consumption.';
          emitWarning(msg, 'UnboundedCacheWarning', code, LRUCache);
        }
      }

      if (stale) {
        deprecatedOption('stale', 'allowStale');
      }
      if (maxAge) {
        deprecatedOption('maxAge', 'ttl');
      }
      if (length) {
        deprecatedOption('length', 'sizeCalculation');
      }
    }

    getRemainingTTL(key) {
      return this.has(key, { updateAgeOnHas: false }) ? Infinity : 0
    }

    initializeTTLTracking() {
      this.ttls = new ZeroArray(this.max);
      this.starts = new ZeroArray(this.max);

      this.setItemTTL = (index, ttl, start = perf.now()) => {
        this.starts[index] = ttl !== 0 ? start : 0;
        this.ttls[index] = ttl;
        if (ttl !== 0 && this.ttlAutopurge) {
          const t = setTimeout(() => {
            if (this.isStale(index)) {
              this.delete(this.keyList[index]);
            }
          }, ttl + 1);
          /* istanbul ignore else - unref() not supported on all platforms */
          if (t.unref) {
            t.unref();
          }
        }
      };

      this.updateItemAge = index => {
        this.starts[index] = this.ttls[index] !== 0 ? perf.now() : 0;
      };

      this.statusTTL = (status, index) => {
        if (status) {
          status.ttl = this.ttls[index];
          status.start = this.starts[index];
          status.now = cachedNow || getNow();
          status.remainingTTL = status.now + status.ttl - status.start;
        }
      };

      // debounce calls to perf.now() to 1s so we're not hitting
      // that costly call repeatedly.
      let cachedNow = 0;
      const getNow = () => {
        const n = perf.now();
        if (this.ttlResolution > 0) {
          cachedNow = n;
          const t = setTimeout(
            () => (cachedNow = 0),
            this.ttlResolution
          );
          /* istanbul ignore else - not available on all platforms */
          if (t.unref) {
            t.unref();
          }
        }
        return n
      };

      this.getRemainingTTL = key => {
        const index = this.keyMap.get(key);
        if (index === undefined) {
          return 0
        }
        return this.ttls[index] === 0 || this.starts[index] === 0
          ? Infinity
          : this.starts[index] +
              this.ttls[index] -
              (cachedNow || getNow())
      };

      this.isStale = index => {
        return (
          this.ttls[index] !== 0 &&
          this.starts[index] !== 0 &&
          (cachedNow || getNow()) - this.starts[index] >
            this.ttls[index]
        )
      };
    }
    updateItemAge(_index) {}
    statusTTL(_status, _index) {}
    setItemTTL(_index, _ttl, _start) {}
    isStale(_index) {
      return false
    }

    initializeSizeTracking() {
      this.calculatedSize = 0;
      this.sizes = new ZeroArray(this.max);
      this.removeItemSize = index => {
        this.calculatedSize -= this.sizes[index];
        this.sizes[index] = 0;
      };
      this.requireSize = (k, v, size, sizeCalculation) => {
        // provisionally accept background fetches.
        // actual value size will be checked when they return.
        if (this.isBackgroundFetch(v)) {
          return 0
        }
        if (!isPosInt(size)) {
          if (sizeCalculation) {
            if (typeof sizeCalculation !== 'function') {
              throw new TypeError('sizeCalculation must be a function')
            }
            size = sizeCalculation(v, k);
            if (!isPosInt(size)) {
              throw new TypeError(
                'sizeCalculation return invalid (expect positive integer)'
              )
            }
          } else {
            throw new TypeError(
              'invalid size value (must be positive integer). ' +
                'When maxSize or maxEntrySize is used, sizeCalculation or size ' +
                'must be set.'
            )
          }
        }
        return size
      };
      this.addItemSize = (index, size, status) => {
        this.sizes[index] = size;
        if (this.maxSize) {
          const maxSize = this.maxSize - this.sizes[index];
          while (this.calculatedSize > maxSize) {
            this.evict(true);
          }
        }
        this.calculatedSize += this.sizes[index];
        if (status) {
          status.entrySize = size;
          status.totalCalculatedSize = this.calculatedSize;
        }
      };
    }
    removeItemSize(_index) {}
    addItemSize(_index, _size) {}
    requireSize(_k, _v, size, sizeCalculation) {
      if (size || sizeCalculation) {
        throw new TypeError(
          'cannot set size without setting maxSize or maxEntrySize on cache'
        )
      }
    }

    *indexes({ allowStale = this.allowStale } = {}) {
      if (this.size) {
        for (let i = this.tail; true; ) {
          if (!this.isValidIndex(i)) {
            break
          }
          if (allowStale || !this.isStale(i)) {
            yield i;
          }
          if (i === this.head) {
            break
          } else {
            i = this.prev[i];
          }
        }
      }
    }

    *rindexes({ allowStale = this.allowStale } = {}) {
      if (this.size) {
        for (let i = this.head; true; ) {
          if (!this.isValidIndex(i)) {
            break
          }
          if (allowStale || !this.isStale(i)) {
            yield i;
          }
          if (i === this.tail) {
            break
          } else {
            i = this.next[i];
          }
        }
      }
    }

    isValidIndex(index) {
      return (
        index !== undefined &&
        this.keyMap.get(this.keyList[index]) === index
      )
    }

    *entries() {
      for (const i of this.indexes()) {
        if (
          this.valList[i] !== undefined &&
          this.keyList[i] !== undefined &&
          !this.isBackgroundFetch(this.valList[i])
        ) {
          yield [this.keyList[i], this.valList[i]];
        }
      }
    }
    *rentries() {
      for (const i of this.rindexes()) {
        if (
          this.valList[i] !== undefined &&
          this.keyList[i] !== undefined &&
          !this.isBackgroundFetch(this.valList[i])
        ) {
          yield [this.keyList[i], this.valList[i]];
        }
      }
    }

    *keys() {
      for (const i of this.indexes()) {
        if (
          this.keyList[i] !== undefined &&
          !this.isBackgroundFetch(this.valList[i])
        ) {
          yield this.keyList[i];
        }
      }
    }
    *rkeys() {
      for (const i of this.rindexes()) {
        if (
          this.keyList[i] !== undefined &&
          !this.isBackgroundFetch(this.valList[i])
        ) {
          yield this.keyList[i];
        }
      }
    }

    *values() {
      for (const i of this.indexes()) {
        if (
          this.valList[i] !== undefined &&
          !this.isBackgroundFetch(this.valList[i])
        ) {
          yield this.valList[i];
        }
      }
    }
    *rvalues() {
      for (const i of this.rindexes()) {
        if (
          this.valList[i] !== undefined &&
          !this.isBackgroundFetch(this.valList[i])
        ) {
          yield this.valList[i];
        }
      }
    }

    [Symbol.iterator]() {
      return this.entries()
    }

    find(fn, getOptions) {
      for (const i of this.indexes()) {
        const v = this.valList[i];
        const value = this.isBackgroundFetch(v)
          ? v.__staleWhileFetching
          : v;
        if (value === undefined) continue
        if (fn(value, this.keyList[i], this)) {
          return this.get(this.keyList[i], getOptions)
        }
      }
    }

    forEach(fn, thisp = this) {
      for (const i of this.indexes()) {
        const v = this.valList[i];
        const value = this.isBackgroundFetch(v)
          ? v.__staleWhileFetching
          : v;
        if (value === undefined) continue
        fn.call(thisp, value, this.keyList[i], this);
      }
    }

    rforEach(fn, thisp = this) {
      for (const i of this.rindexes()) {
        const v = this.valList[i];
        const value = this.isBackgroundFetch(v)
          ? v.__staleWhileFetching
          : v;
        if (value === undefined) continue
        fn.call(thisp, value, this.keyList[i], this);
      }
    }

    get prune() {
      deprecatedMethod('prune', 'purgeStale');
      return this.purgeStale
    }

    purgeStale() {
      let deleted = false;
      for (const i of this.rindexes({ allowStale: true })) {
        if (this.isStale(i)) {
          this.delete(this.keyList[i]);
          deleted = true;
        }
      }
      return deleted
    }

    dump() {
      const arr = [];
      for (const i of this.indexes({ allowStale: true })) {
        const key = this.keyList[i];
        const v = this.valList[i];
        const value = this.isBackgroundFetch(v)
          ? v.__staleWhileFetching
          : v;
        if (value === undefined) continue
        const entry = { value };
        if (this.ttls) {
          entry.ttl = this.ttls[i];
          // always dump the start relative to a portable timestamp
          // it's ok for this to be a bit slow, it's a rare operation.
          const age = perf.now() - this.starts[i];
          entry.start = Math.floor(Date.now() - age);
        }
        if (this.sizes) {
          entry.size = this.sizes[i];
        }
        arr.unshift([key, entry]);
      }
      return arr
    }

    load(arr) {
      this.clear();
      for (const [key, entry] of arr) {
        if (entry.start) {
          // entry.start is a portable timestamp, but we may be using
          // node's performance.now(), so calculate the offset.
          // it's ok for this to be a bit slow, it's a rare operation.
          const age = Date.now() - entry.start;
          entry.start = perf.now() - age;
        }
        this.set(key, entry.value, entry);
      }
    }

    dispose(_v, _k, _reason) {}

    set(
      k,
      v,
      {
        ttl = this.ttl,
        start,
        noDisposeOnSet = this.noDisposeOnSet,
        size = 0,
        sizeCalculation = this.sizeCalculation,
        noUpdateTTL = this.noUpdateTTL,
        status,
      } = {}
    ) {
      size = this.requireSize(k, v, size, sizeCalculation);
      // if the item doesn't fit, don't do anything
      // NB: maxEntrySize set to maxSize by default
      if (this.maxEntrySize && size > this.maxEntrySize) {
        if (status) {
          status.set = 'miss';
          status.maxEntrySizeExceeded = true;
        }
        // have to delete, in case a background fetch is there already.
        // in non-async cases, this is a no-op
        this.delete(k);
        return this
      }
      let index = this.size === 0 ? undefined : this.keyMap.get(k);
      if (index === undefined) {
        // addition
        index = this.newIndex();
        this.keyList[index] = k;
        this.valList[index] = v;
        this.keyMap.set(k, index);
        this.next[this.tail] = index;
        this.prev[index] = this.tail;
        this.tail = index;
        this.size++;
        this.addItemSize(index, size, status);
        if (status) {
          status.set = 'add';
        }
        noUpdateTTL = false;
      } else {
        // update
        this.moveToTail(index);
        const oldVal = this.valList[index];
        if (v !== oldVal) {
          if (this.isBackgroundFetch(oldVal)) {
            oldVal.__abortController.abort(new Error('replaced'));
          } else {
            if (!noDisposeOnSet) {
              this.dispose(oldVal, k, 'set');
              if (this.disposeAfter) {
                this.disposed.push([oldVal, k, 'set']);
              }
            }
          }
          this.removeItemSize(index);
          this.valList[index] = v;
          this.addItemSize(index, size, status);
          if (status) {
            status.set = 'replace';
            const oldValue =
              oldVal && this.isBackgroundFetch(oldVal)
                ? oldVal.__staleWhileFetching
                : oldVal;
            if (oldValue !== undefined) status.oldValue = oldValue;
          }
        } else if (status) {
          status.set = 'update';
        }
      }
      if (ttl !== 0 && this.ttl === 0 && !this.ttls) {
        this.initializeTTLTracking();
      }
      if (!noUpdateTTL) {
        this.setItemTTL(index, ttl, start);
      }
      this.statusTTL(status, index);
      if (this.disposeAfter) {
        while (this.disposed.length) {
          this.disposeAfter(...this.disposed.shift());
        }
      }
      return this
    }

    newIndex() {
      if (this.size === 0) {
        return this.tail
      }
      if (this.size === this.max && this.max !== 0) {
        return this.evict(false)
      }
      if (this.free.length !== 0) {
        return this.free.pop()
      }
      // initial fill, just keep writing down the list
      return this.initialFill++
    }

    pop() {
      if (this.size) {
        const val = this.valList[this.head];
        this.evict(true);
        return val
      }
    }

    evict(free) {
      const head = this.head;
      const k = this.keyList[head];
      const v = this.valList[head];
      if (this.isBackgroundFetch(v)) {
        v.__abortController.abort(new Error('evicted'));
      } else {
        this.dispose(v, k, 'evict');
        if (this.disposeAfter) {
          this.disposed.push([v, k, 'evict']);
        }
      }
      this.removeItemSize(head);
      // if we aren't about to use the index, then null these out
      if (free) {
        this.keyList[head] = null;
        this.valList[head] = null;
        this.free.push(head);
      }
      this.head = this.next[head];
      this.keyMap.delete(k);
      this.size--;
      return head
    }

    has(k, { updateAgeOnHas = this.updateAgeOnHas, status } = {}) {
      const index = this.keyMap.get(k);
      if (index !== undefined) {
        if (!this.isStale(index)) {
          if (updateAgeOnHas) {
            this.updateItemAge(index);
          }
          if (status) status.has = 'hit';
          this.statusTTL(status, index);
          return true
        } else if (status) {
          status.has = 'stale';
          this.statusTTL(status, index);
        }
      } else if (status) {
        status.has = 'miss';
      }
      return false
    }

    // like get(), but without any LRU updating or TTL expiration
    peek(k, { allowStale = this.allowStale } = {}) {
      const index = this.keyMap.get(k);
      if (index !== undefined && (allowStale || !this.isStale(index))) {
        const v = this.valList[index];
        // either stale and allowed, or forcing a refresh of non-stale value
        return this.isBackgroundFetch(v) ? v.__staleWhileFetching : v
      }
    }

    backgroundFetch(k, index, options, context) {
      const v = index === undefined ? undefined : this.valList[index];
      if (this.isBackgroundFetch(v)) {
        return v
      }
      const ac = new AC();
      if (options.signal) {
        options.signal.addEventListener('abort', () =>
          ac.abort(options.signal.reason)
        );
      }
      const fetchOpts = {
        signal: ac.signal,
        options,
        context,
      };
      const cb = (v, updateCache = false) => {
        const { aborted } = ac.signal;
        const ignoreAbort = options.ignoreFetchAbort && v !== undefined;
        if (options.status) {
          if (aborted && !updateCache) {
            options.status.fetchAborted = true;
            options.status.fetchError = ac.signal.reason;
            if (ignoreAbort) options.status.fetchAbortIgnored = true;
          } else {
            options.status.fetchResolved = true;
          }
        }
        if (aborted && !ignoreAbort && !updateCache) {
          return fetchFail(ac.signal.reason)
        }
        // either we didn't abort, and are still here, or we did, and ignored
        if (this.valList[index] === p) {
          if (v === undefined) {
            if (p.__staleWhileFetching) {
              this.valList[index] = p.__staleWhileFetching;
            } else {
              this.delete(k);
            }
          } else {
            if (options.status) options.status.fetchUpdated = true;
            this.set(k, v, fetchOpts.options);
          }
        }
        return v
      };
      const eb = er => {
        if (options.status) {
          options.status.fetchRejected = true;
          options.status.fetchError = er;
        }
        return fetchFail(er)
      };
      const fetchFail = er => {
        const { aborted } = ac.signal;
        const allowStaleAborted =
          aborted && options.allowStaleOnFetchAbort;
        const allowStale =
          allowStaleAborted || options.allowStaleOnFetchRejection;
        const noDelete = allowStale || options.noDeleteOnFetchRejection;
        if (this.valList[index] === p) {
          // if we allow stale on fetch rejections, then we need to ensure that
          // the stale value is not removed from the cache when the fetch fails.
          const del = !noDelete || p.__staleWhileFetching === undefined;
          if (del) {
            this.delete(k);
          } else if (!allowStaleAborted) {
            // still replace the *promise* with the stale value,
            // since we are done with the promise at this point.
            // leave it untouched if we're still waiting for an
            // aborted background fetch that hasn't yet returned.
            this.valList[index] = p.__staleWhileFetching;
          }
        }
        if (allowStale) {
          if (options.status && p.__staleWhileFetching !== undefined) {
            options.status.returnedStale = true;
          }
          return p.__staleWhileFetching
        } else if (p.__returned === p) {
          throw er
        }
      };
      const pcall = (res, rej) => {
        this.fetchMethod(k, v, fetchOpts).then(v => res(v), rej);
        // ignored, we go until we finish, regardless.
        // defer check until we are actually aborting,
        // so fetchMethod can override.
        ac.signal.addEventListener('abort', () => {
          if (
            !options.ignoreFetchAbort ||
            options.allowStaleOnFetchAbort
          ) {
            res();
            // when it eventually resolves, update the cache.
            if (options.allowStaleOnFetchAbort) {
              res = v => cb(v, true);
            }
          }
        });
      };
      if (options.status) options.status.fetchDispatched = true;
      const p = new Promise(pcall).then(cb, eb);
      p.__abortController = ac;
      p.__staleWhileFetching = v;
      p.__returned = null;
      if (index === undefined) {
        // internal, don't expose status.
        this.set(k, p, { ...fetchOpts.options, status: undefined });
        index = this.keyMap.get(k);
      } else {
        this.valList[index] = p;
      }
      return p
    }

    isBackgroundFetch(p) {
      return (
        p &&
        typeof p === 'object' &&
        typeof p.then === 'function' &&
        Object.prototype.hasOwnProperty.call(
          p,
          '__staleWhileFetching'
        ) &&
        Object.prototype.hasOwnProperty.call(p, '__returned') &&
        (p.__returned === p || p.__returned === null)
      )
    }

    // this takes the union of get() and set() opts, because it does both
    async fetch(
      k,
      {
        // get options
        allowStale = this.allowStale,
        updateAgeOnGet = this.updateAgeOnGet,
        noDeleteOnStaleGet = this.noDeleteOnStaleGet,
        // set options
        ttl = this.ttl,
        noDisposeOnSet = this.noDisposeOnSet,
        size = 0,
        sizeCalculation = this.sizeCalculation,
        noUpdateTTL = this.noUpdateTTL,
        // fetch exclusive options
        noDeleteOnFetchRejection = this.noDeleteOnFetchRejection,
        allowStaleOnFetchRejection = this.allowStaleOnFetchRejection,
        ignoreFetchAbort = this.ignoreFetchAbort,
        allowStaleOnFetchAbort = this.allowStaleOnFetchAbort,
        fetchContext = this.fetchContext,
        forceRefresh = false,
        status,
        signal,
      } = {}
    ) {
      if (!this.fetchMethod) {
        if (status) status.fetch = 'get';
        return this.get(k, {
          allowStale,
          updateAgeOnGet,
          noDeleteOnStaleGet,
          status,
        })
      }

      const options = {
        allowStale,
        updateAgeOnGet,
        noDeleteOnStaleGet,
        ttl,
        noDisposeOnSet,
        size,
        sizeCalculation,
        noUpdateTTL,
        noDeleteOnFetchRejection,
        allowStaleOnFetchRejection,
        allowStaleOnFetchAbort,
        ignoreFetchAbort,
        status,
        signal,
      };

      let index = this.keyMap.get(k);
      if (index === undefined) {
        if (status) status.fetch = 'miss';
        const p = this.backgroundFetch(k, index, options, fetchContext);
        return (p.__returned = p)
      } else {
        // in cache, maybe already fetching
        const v = this.valList[index];
        if (this.isBackgroundFetch(v)) {
          const stale =
            allowStale && v.__staleWhileFetching !== undefined;
          if (status) {
            status.fetch = 'inflight';
            if (stale) status.returnedStale = true;
          }
          return stale ? v.__staleWhileFetching : (v.__returned = v)
        }

        // if we force a refresh, that means do NOT serve the cached value,
        // unless we are already in the process of refreshing the cache.
        const isStale = this.isStale(index);
        if (!forceRefresh && !isStale) {
          if (status) status.fetch = 'hit';
          this.moveToTail(index);
          if (updateAgeOnGet) {
            this.updateItemAge(index);
          }
          this.statusTTL(status, index);
          return v
        }

        // ok, it is stale or a forced refresh, and not already fetching.
        // refresh the cache.
        const p = this.backgroundFetch(k, index, options, fetchContext);
        const hasStale = p.__staleWhileFetching !== undefined;
        const staleVal = hasStale && allowStale;
        if (status) {
          status.fetch = hasStale && isStale ? 'stale' : 'refresh';
          if (staleVal && isStale) status.returnedStale = true;
        }
        return staleVal ? p.__staleWhileFetching : (p.__returned = p)
      }
    }

    get(
      k,
      {
        allowStale = this.allowStale,
        updateAgeOnGet = this.updateAgeOnGet,
        noDeleteOnStaleGet = this.noDeleteOnStaleGet,
        status,
      } = {}
    ) {
      const index = this.keyMap.get(k);
      if (index !== undefined) {
        const value = this.valList[index];
        const fetching = this.isBackgroundFetch(value);
        this.statusTTL(status, index);
        if (this.isStale(index)) {
          if (status) status.get = 'stale';
          // delete only if not an in-flight background fetch
          if (!fetching) {
            if (!noDeleteOnStaleGet) {
              this.delete(k);
            }
            if (status) status.returnedStale = allowStale;
            return allowStale ? value : undefined
          } else {
            if (status) {
              status.returnedStale =
                allowStale && value.__staleWhileFetching !== undefined;
            }
            return allowStale ? value.__staleWhileFetching : undefined
          }
        } else {
          if (status) status.get = 'hit';
          // if we're currently fetching it, we don't actually have it yet
          // it's not stale, which means this isn't a staleWhileRefetching.
          // If it's not stale, and fetching, AND has a __staleWhileFetching
          // value, then that means the user fetched with {forceRefresh:true},
          // so it's safe to return that value.
          if (fetching) {
            return value.__staleWhileFetching
          }
          this.moveToTail(index);
          if (updateAgeOnGet) {
            this.updateItemAge(index);
          }
          return value
        }
      } else if (status) {
        status.get = 'miss';
      }
    }

    connect(p, n) {
      this.prev[n] = p;
      this.next[p] = n;
    }

    moveToTail(index) {
      // if tail already, nothing to do
      // if head, move head to next[index]
      // else
      //   move next[prev[index]] to next[index] (head has no prev)
      //   move prev[next[index]] to prev[index]
      // prev[index] = tail
      // next[tail] = index
      // tail = index
      if (index !== this.tail) {
        if (index === this.head) {
          this.head = this.next[index];
        } else {
          this.connect(this.prev[index], this.next[index]);
        }
        this.connect(this.tail, index);
        this.tail = index;
      }
    }

    get del() {
      deprecatedMethod('del', 'delete');
      return this.delete
    }

    delete(k) {
      let deleted = false;
      if (this.size !== 0) {
        const index = this.keyMap.get(k);
        if (index !== undefined) {
          deleted = true;
          if (this.size === 1) {
            this.clear();
          } else {
            this.removeItemSize(index);
            const v = this.valList[index];
            if (this.isBackgroundFetch(v)) {
              v.__abortController.abort(new Error('deleted'));
            } else {
              this.dispose(v, k, 'delete');
              if (this.disposeAfter) {
                this.disposed.push([v, k, 'delete']);
              }
            }
            this.keyMap.delete(k);
            this.keyList[index] = null;
            this.valList[index] = null;
            if (index === this.tail) {
              this.tail = this.prev[index];
            } else if (index === this.head) {
              this.head = this.next[index];
            } else {
              this.next[this.prev[index]] = this.next[index];
              this.prev[this.next[index]] = this.prev[index];
            }
            this.size--;
            this.free.push(index);
          }
        }
      }
      if (this.disposed) {
        while (this.disposed.length) {
          this.disposeAfter(...this.disposed.shift());
        }
      }
      return deleted
    }

    clear() {
      for (const index of this.rindexes({ allowStale: true })) {
        const v = this.valList[index];
        if (this.isBackgroundFetch(v)) {
          v.__abortController.abort(new Error('deleted'));
        } else {
          const k = this.keyList[index];
          this.dispose(v, k, 'delete');
          if (this.disposeAfter) {
            this.disposed.push([v, k, 'delete']);
          }
        }
      }

      this.keyMap.clear();
      this.valList.fill(null);
      this.keyList.fill(null);
      if (this.ttls) {
        this.ttls.fill(0);
        this.starts.fill(0);
      }
      if (this.sizes) {
        this.sizes.fill(0);
      }
      this.head = 0;
      this.tail = 0;
      this.initialFill = 1;
      this.free.length = 0;
      this.calculatedSize = 0;
      this.size = 0;
      if (this.disposed) {
        while (this.disposed.length) {
          this.disposeAfter(...this.disposed.shift());
        }
      }
    }

    get reset() {
      deprecatedMethod('reset', 'clear');
      return this.clear
    }

    get length() {
      deprecatedProperty('length', 'size');
      return this.size
    }

    static get AbortController() {
      return AC
    }
    static get AbortSignal() {
      return AS
    }
  }

  var LRUCache$1 = LRUCache;

  /******************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */

  function __awaiter(thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
  }

  function __generator(thisArg, body) {
      var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
      function verb(n) { return function (v) { return step([n, v]); }; }
      function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (g && (g = 0, op[0] && (_ = 0)), _) try {
              if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
              if (y = 0, t) op = [op[0] & 2, t.value];
              switch (op[0]) {
                  case 0: case 1: t = op; break;
                  case 4: _.label++; return { value: op[1], done: false };
                  case 5: _.label++; y = op[1]; op = [0]; continue;
                  case 7: op = _.ops.pop(); _.trys.pop(); continue;
                  default:
                      if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                      if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                      if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                      if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                      if (t[2]) _.ops.pop();
                      _.trys.pop(); continue;
              }
              op = body.call(thisArg, _);
          } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
          if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
      }
  }

  typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
      var e = new Error(message);
      return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };

  /**
   * @author Kuitos
   * @homepage https://github.com/kuitos/
   * @since 2017-10-12
   */
  function buildSortedURL() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
      }
      var url = args[0], params = args[1], paramsSerializer = args[2];
      var builtURL = axios__default["default"].getUri({ url: url, params: params, paramsSerializer: paramsSerializer });
      var _a = builtURL.split('?'), urlPath = _a[0], queryString = _a[1];
      if (queryString) {
          var paramsPair = queryString.split('&');
          return "".concat(urlPath, "?").concat(paramsPair.sort().join('&'));
      }
      return builtURL;
  }

  function isCacheLike(cache) {
      return typeof cache.get === 'function' && typeof cache.set === 'function' && (typeof cache.delete === 'function' || typeof cache.del === 'function');
  }

  /**
   * @author Kuitos
   * @homepage https://github.com/kuitos/
   * @since 2017-10-12
   */
  var FIVE_MINUTES = 1000 * 60 * 5;
  var CAPACITY = 100;
  function cacheAdapterEnhancer(adapter, options) {
      var _this = this;
      if (options === void 0) { options = {}; }
      var _a = options.enabledByDefault, enabledByDefault = _a === void 0 ? true : _a, _b = options.cacheFlag, cacheFlag = _b === void 0 ? 'cache' : _b, _c = options.defaultCache, defaultCache = _c === void 0 ? new LRUCache$1({ ttl: FIVE_MINUTES, max: CAPACITY }) : _c;
      return function (config) {
          var url = config.url, method = config.method, params = config.params, paramsSerializer = config.paramsSerializer, forceUpdate = config.forceUpdate;
          var useCache = (config[cacheFlag] !== void 0 && config[cacheFlag] !== null)
              ? config[cacheFlag]
              : enabledByDefault;
          if (method === 'get' && useCache) {
              // if had provided a specified cache, then use it instead
              var cache_1 = isCacheLike(useCache) ? useCache : defaultCache;
              // build the index according to the url and params
              var defaultCacheKey = buildSortedURL(url, params, paramsSerializer);
              // if had provided key generator, then use it to produce custom key
              var customCacheKey = options.cacheKeyGenerator && options.cacheKeyGenerator(config, defaultCacheKey);
              var index_1 = customCacheKey || defaultCacheKey;
              var responsePromise = cache_1.get(index_1);
              if (!responsePromise || forceUpdate) {
                  responsePromise = (function () { return __awaiter(_this, void 0, void 0, function () {
                      var reason_1;
                      return __generator(this, function (_a) {
                          switch (_a.label) {
                              case 0:
                                  _a.trys.push([0, 2, , 3]);
                                  return [4 /*yield*/, adapter(config)];
                              case 1: return [2 /*return*/, _a.sent()];
                              case 2:
                                  reason_1 = _a.sent();
                                  'delete' in cache_1 ? cache_1.delete(index_1) : cache_1.del(index_1);
                                  throw reason_1;
                              case 3: return [2 /*return*/];
                          }
                      });
                  }); })();
                  // put the promise for the non-transformed response into cache as a placeholder
                  cache_1.set(index_1, responsePromise);
                  return responsePromise;
              }
              /* istanbul ignore next */
              if (process.env.LOGGER_LEVEL === 'info') {
                  // eslint-disable-next-line no-console
                  console.info("[axios-extensions] request cached by cache adapter --> url: ".concat(index_1));
              }
              return responsePromise;
          }
          return adapter(config);
      };
  }

  /**
   * @author Kuitos
   * @since 2020-02-18
   */
  function retryAdapterEnhancer(adapter, options) {
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

  /**
   * @author Kuitos
   * @homepage https://github.com/kuitos/
   * @since 2017-10-11
   */
  function throttleAdapterEnhancer(adapter, options) {
      var _this = this;
      if (options === void 0) { options = {}; }
      var _a = options.threshold, threshold = _a === void 0 ? 1000 : _a, _b = options.cache, cache = _b === void 0 ? new LRUCache$1({ max: 10 }) : _b;
      var recordCacheWithRequest = function (index, config) {
          var responsePromise = (function () { return __awaiter(_this, void 0, void 0, function () {
              var response, reason_1;
              return __generator(this, function (_a) {
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
          var index = buildSortedURL(url, params, paramsSerializer);
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

  exports.Cache = LRUCache$1;
  exports.cacheAdapterEnhancer = cacheAdapterEnhancer;
  exports.retryAdapterEnhancer = retryAdapterEnhancer;
  exports.throttleAdapterEnhancer = throttleAdapterEnhancer;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=axios-extensions.js.map
