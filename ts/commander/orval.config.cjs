// ts/commander/orval.config.cjs
const { defineConfig } = require('orval')

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

            override: {
                formData: {
                    // point at your own formData builder:
                    path: './src/api/mutator/formData.ts',
                    name: 'createFormData',
                },
            },
        },
    },
})
