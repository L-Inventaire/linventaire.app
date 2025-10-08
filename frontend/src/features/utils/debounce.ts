const debounceRequests: Map<string, () => void | Promise<void>> = new Map();
const debounceRequestsHasTimout: Map<string, boolean> = new Map();
let debounceKeyCounter = 0;

export const debounce = (
  request: () => void | Promise<void>,
  options: { key?: string; timeout?: number; doInitialCall?: boolean } = {}
) => {
  const key = options.key || `debounce-${debounceKeyCounter}`;
  debounceKeyCounter++;
  options.timeout = options.timeout || 1000;
  options.doInitialCall = options.doInitialCall === false ? false : true;

  if (!debounceRequestsHasTimout.has(key)) {
    debounceRequestsHasTimout.set(key, true);
    if (options.doInitialCall) request();
    else debounceRequests.set(key, request);
    setTimeout(() => {
      const request = debounceRequests.get(key);
      debounceRequestsHasTimout.delete(key);
      if (request) debounce(request, { ...options, key, doInitialCall: true });
      debounceRequests.delete(key);
    }, options.timeout);
  } else {
    debounceRequests.set(key, request);
  }
};
