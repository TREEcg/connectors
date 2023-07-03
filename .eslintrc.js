module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "jest": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
    ],
    "overrides": [
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "tsconfigRootDir": __dirname, // this is the reason this is a .js file
        "project": ["./tsconfig.eslint.json"],
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "indent": "off",
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/indent": ["error", 4, {
            // typescript docs indent the case from the switch
            // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-8.html#example-4
            SwitchCase: 1,
            flatTernaryExpressions: false,
            ignoredNodes: [],
        }],
        "@typescript-eslint/consistent-type-assertions": [
            "error",
            { assertionStyle: "angle-bracket" },
        ],
        "@typescript-eslint/naming-convention": [
            "error",
            {
                selector: "interface",
                format: ["PascalCase"],
                custom: {
                    regex: "^[A-Z]",
                    match: true,
                },
            },
        ],
        "@typescript-eslint/explicit-function-return-type": [
            "error",
            {
                allowExpressions: true,
                allowTypedFunctionExpressions: true,
                allowHigherOrderFunctions: true,
                allowConciseArrowFunctionExpressionsStartingWithVoid: true,
            },
        ],
        "@typescript-eslint/consistent-type-imports": [
            "error",
            { prefer: "type-imports" },
        ],
        "@typescript-eslint/no-namespace": "off",
        "import/order": [
            "error",
            {
                alphabetize: {
                    order: "asc",
                    caseInsensitive: true,
                },
            },
        ],
    }
}
