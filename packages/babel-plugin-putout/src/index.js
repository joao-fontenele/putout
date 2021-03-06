import {
    parse,
    print,
    transform,
    parseOptions,
} from 'putout';

export default function() {
    let code = '';
    
    return {
        name: 'putout',
        visitor: {
            Program(path, {filename, opts}) {
                const options = parseOptions({
                    filename,
                    options: opts,
                });
                
                transform(
                    path.container,
                    code,
                    options,
                );
            },
        },
        
        parserOverride(source) {
            code = source;
            return parse(source);
        },
        
        generatorOverride(ast) {
            ast.program.directives = [];
            const code = print(ast);
            return {code};
        },
    };
}

