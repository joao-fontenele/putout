'use strict';

const {types} = require('putout');
const {isIdentifier} = types;

module.exports = ({use, declare}) => ({
    GenericTypeAnnotation(path) {
        const {node} = path;
        const {id} = node;
        
        if (isIdentifier(id))
            use(path, id.name);
    },
    QualifiedTypeIdentifier(path) {
        const {qualification} = path.node;
        
        if (isIdentifier(qualification))
            use(path, qualification.name);
    },
    
    InterfaceDeclaration(path) {
        declare(path, path.node.id.name);
    },
});

