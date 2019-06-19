'use strict';

const {types} = require('putout');
const {
    NumericLiteral,
} = types;

module.exports.report = () => `Numeric separators should be used`;

module.exports.fix = (path) => {
    const {node} = path;
    const {raw, value} = node;
    
    node.raw = split(raw);
    console.log(node);
};

module.exports.traverse = ({push}) => {
    return {
        NumericLiteral(path) {
            const {raw} = path.node;
            
            if (raw.includes('_'))
                return;
            
            push(path);
        },
    };
};

function split(str) {
    const n = str.length - 1;
    let i = str.length;
    const result = [];
    
    while (--i > -1) {
        const a = n - i;
        
        if (a && a % 3 === 0)
            result.unshift('_');
        
        result.unshift(str.charAt(i));
    }
    
    return result.join('');
}

