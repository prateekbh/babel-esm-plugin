function mergeAliases(parentAliases, overrides) {
  return { ...parentAliases, ...overrides };
}

module.exports = {
  mergeAliases,
};
