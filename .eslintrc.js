module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'no-unused-vars': 'warn',
    'import/no-unused-modules': [1, { unusedExports: true }],
  },
};
