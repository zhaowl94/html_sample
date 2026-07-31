export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [
    "assignment-1 2/css/Mutual evaluation.css",
    "assignment-1 2/css/hw1 - old.css",
    "assignment-1 2/css/hw1 - old2.css",
  ],
  rules: {
    "custom-property-empty-line-before": null,
    "declaration-empty-line-before": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "media-feature-range-notation": "prefix",
    "no-descending-specificity": null,
    "selector-class-pattern": null,
  },
};
