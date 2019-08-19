'use strict';

const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const types = require('@babel/types');
const once = require('once');

const runFix = require('./run-fix');
const mergeVisitors = require('./merge-visitors');

const {
    getPath,
    getPosition,
} = require('./get-position');

const isRemoved = (a) => a && a.removed;

module.exports = ({ast, shebang, fix, fixCount, plugins}) => {
    let places = [];
    
    const merge = once(mergeVisitors);
    const {
        pluginsFind,
        pluginsTraverse,
    } = splitPlugins(plugins);
    
    for (let i = 0; i < fixCount; i++) {
        places = run({
            ast,
            fix,
            shebang,
            pluginsFind,
            pluginsTraverse,
            merge,
        });
        
        if (!fix || !places.length)
            return places;
    }
    
    return places;
};

module.exports.getPosition = getPosition;

function run({ast, fix, shebang, pluginsFind, pluginsTraverse, merge}) {
    return [
        ...runWithoutMerge({ast, fix, shebang, pluginsFind}),
        ...runWithMerge({ast, fix, shebang, pluginsTraverse, merge}),
    ];
}

function runWithMerge({ast, fix, shebang, pluginsTraverse, merge}) {
    const {entries, visitor} = merge(pluginsTraverse, {
        fix,
        shebang,
    });
    
    traverse(ast, visitor);
    
    const places = [];
    for (const [rule, pull] of entries) {
        const items = pull();
        for (const {message, position} of items) {
            places.push({
                rule,
                message,
                position,
            });
        }
    }
    
    return places;
}

function runWithoutMerge({ast, fix, shebang, pluginsFind}) {
    const places = [];
    
    for (const {rule, plugin, msg, options} of pluginsFind) {
        const {
            report,
            find,
        } = plugin;
        
        const items = superFind({
            find,
            ast,
            options,
        });
        
        if (!items.length)
            continue;
        
        for (const item of items) {
            const message = msg || report(item);
            const {parentPath} = getPath(item);
            const position = getPosition(item, shebang);
            
            places.push({
                rule,
                message,
                position,
            });
            
            if (isRemoved(parentPath))
                continue;
            
            runFix(fix, plugin.fix, {
                path: item,
                position,
            });
        }
    }
    
    return places;
}

function superFind({find, ast, options}) {
    const pushItems = [];
    const push = (a) => {
        pushItems.push(a);
    };
    
    const returnItems = find(ast, {
        traverse,
        generate,
        types,
        push,
        options,
    });
    
    return [
        ...pushItems,
        ...returnItems || [],
    ];
}

function splitPlugins(plugins) {
    const pluginsFind = [];
    const pluginsTraverse = [];
    
    for (const item of plugins) {
        const {plugin} = item;
        
        if (plugin.find)
            pluginsFind.push(item);
        
        if (plugin.traverse)
            pluginsTraverse.push(item);
    }
    
    return {
        pluginsFind,
        pluginsTraverse,
    };
}

