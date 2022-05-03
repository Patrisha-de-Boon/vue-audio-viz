/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
    root: true,
    extends: [
        'plugin:vue/vue3-essential',
        '@dha/eslint-config-vue3-ts',
    ],
    env: {
        'vue/setup-compiler-macros': true,
    },
};
