import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'

const extensions = ['.ts', '.js']

export default {
    input: 'lib/index.ts',
    output: {
        dir: 'dist',
        format: 'es'
    },
    plugins: [
        resolve({extensions}),
        babel({
            presets: [
                '@babel/preset-typescript',
                [
                    '@babel/preset-env',
                    {
                        targets: {
                            chrome: 70
                        }
                    }
                ]
            ],
            plugins: [
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-object-rest-spread'
            ],
            extensions,
            include: ['lib/**/*']
        })
    ]
}
