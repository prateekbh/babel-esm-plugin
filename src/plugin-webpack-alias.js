module.exports = aliases => {
  return ({ types: t }) => {
    return {
      name: 'webpack-aliasing',
      visitor: {
        CallExpression(path) {
          const { node } = path;
          console.log('found', aliases);
          if (
            node.callee.name === 'require' &&
            node.arguments &&
            node.arguments[0] &&
            node.arguments[0].value in aliases
          ) {
            node.arguments[0] = t.stringLiteral(
              aliases[node.arguments[0].value],
            );
            return;
          }
        },
      },
    };
  };
};
