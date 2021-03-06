'use strict';

const {operate} = require('putout');
const {findBinding} = operate;

module.exports.report = () => `Shorthand properties should be used`;

module.exports.fix = ({path, from, to}) => {
    path.scope.rename(from, to);
    path.node.shorthand = true;
};

module.exports.traverse = ({push, options}) => {
    return {
        '({__:__})'(path) {
            for (const propPath of path.get('properties')) {
                const {shorthand} = propPath.node;
                
                if (shorthand)
                    continue;
                
                const valuePath = propPath.get('value');
                const keyPath = propPath.get('key');
                
                const {ignore = []} = options;
                
                const from = getName(valuePath);
                const to = getName(keyPath);
                
                if (!to)
                    continue;
                
                if (ignore.includes(from))
                    continue;
                
                const bindingFrom = findBinding(propPath, from);
                const bindingTo = findBinding(propPath, to);
                
                if (bindingTo || !bindingFrom)
                    continue;
                
                const {
                    references,
                    path,
                } = bindingFrom;
                
                if (path.isImportSpecifier() || path.isObjectPattern() || path.get('id').isObjectPattern())
                    continue;
                
                if (references > 1)
                    continue;
                
                push({
                    path: propPath,
                    from,
                    to,
                });
            }
        },
    };
};

function getName(path) {
    const {node} = path;
    
    if (path.isIdentifier())
        return node.name;
    
    return '';
}

