/* eslint-env node */
module.exports = {
    root: true,
    extends: [
        'plugin:vue/vue3-essential',
        '@dha/eslint-config-vue3-ts',
    ],
    env: {
        'vue/setup-compiler-macros': true,
    },
    rules: {
        'vue/html-self-closing': ['error', {
            svg: 'any',
        }]
    }
};
