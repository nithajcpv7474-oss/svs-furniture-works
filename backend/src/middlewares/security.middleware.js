import xssFilters from 'xss';

const sanitizeData = (data) => {
  if (typeof data === 'string') {
    return xssFilters(data);
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }
  if (typeof data === 'object' && data !== null) {
    const sanitizedObj = {};
    for (const key in data) {
      sanitizedObj[key] = sanitizeData(data[key]);
    }
    return sanitizedObj;
  }
  return data;
};

export const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = sanitizeData(req.body);
  if (req.params) req.params = sanitizeData(req.params);
  // req.query is a getter in express 5, so we avoid direct reassignment,
  // but we can mutate it if we really need to or just use zod for query params.
  // Instead, we'll sanitize the query params into a new object and override it if express 5 allows via defineProperty
  if (req.query) {
    try {
      const sanitizedQuery = sanitizeData(req.query);
      Object.defineProperty(req, 'query', {
        value: sanitizedQuery,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } catch (e) {
      // ignore if it cannot be redefined
    }
  }
  next();
};

export const preventParameterPollution = (req, res, next) => {
  // If query param is an array, take the last one to prevent pollution
  if (req.query) {
    const newQuery = {};
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        newQuery[key] = req.query[key][req.query[key].length - 1];
      } else {
        newQuery[key] = req.query[key];
      }
    }
    try {
      Object.defineProperty(req, 'query', {
        value: newQuery,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } catch (e) {
      // ignore
    }
  }
  next();
};
