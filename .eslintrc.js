module.exports = {
  extends: 'airbnb-base',
  rules: {
    'no-unused-vars': [
      'error',
      { varsIgnorePattern: '.*[E,e]xport' },
    ],
  },
};
