const { defineConfig } = require('orval');

module.exports = defineConfig({
    corpora: {
        input: {
            target: 'http://corpora-app:8877/api/openapi.json',
        },
        output: {
            mode: 'tags-split',
            target: 'src/api/client.ts',
            schemas: 'src/api/schemas',
            client: 'react-query',
            mutator: {
                path: './src/api/axiosClient.ts',
                name: 'customClient',
            },
            prettier: true,
        },
    },
});
