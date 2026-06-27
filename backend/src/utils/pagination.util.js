/**
 * Standardize pagination parameters and return metadata.
 * 
 * @param {Object} query - The Express request query object (req.query)
 * @param {number} defaultLimit - The default number of items per page
 * @returns {Object} { page, limit, skip }
 */
export const getPaginationParams = (query, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, parseInt(query.limit) || defaultLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Format the standard pagination response.
 * 
 * @param {number} total - Total number of records
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} { total, page, limit, totalPages }
 */
export const formatPaginationResponse = (total, page, limit) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};
