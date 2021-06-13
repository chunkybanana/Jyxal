const STRING_DELIMITER = '`';
const MODIFIERS = '→←vß\\⁽¨ø∆kÞ⁺';
const TWO_MODS = {
    '‡': 'TWO_BYTE_LAMBDA',
    '₌': 'PARALLEL_APPLY',
    '₍': 'LIST_PARALELL_APPLY'
}
const SCC = '‛';
const THREE_MOD = '≬';
const BETTER_MODIFIERS = 'vß⁽';
const NUMBER_CHARS = '1234567890.';
const BASE_255_STRING = '«';
const BASE_255_INT = '»';
const OPENING = {
    '{': 'WHILE',
    '[': 'IF',
    '(': 'FOR',
    'ƛ': 'MAP',
    '\'': 'FILTER',
    'λ': 'LAMBDA',
    '⟨': 'LIST',
    'µ': 'SORT_MAP'
}
const CLOSING = {
    '}': 'CLOSE_WHILE',
    ']': 'CLOSE_IF',
    ')': 'CLOSE_FOR',
    ';': 'CLOSE_MAP',
    '⟩': 'CLOSE_LIST',
}
const NOPS = ' \n'
class TOKEN {
    constructor(name,source){
        this.NAME = name;
        this.SOURCE = source;
    }
}
exports.parse = function(code){
    var structure = "NONE",
    tokens = [],
    struct_nest = [],
    active_code = '',
    string_so_far = '',
    mod_count = 0,
    escaped = false;
    for(char of code){
        if(structure === 'CHAR'){
            if(BETTER_MODIFIERS.includes(string_so_far[string_so_far.length - 1]) && MODIFIERS.includes(char)) {
                string_so_far += char;
                continue;
            }
            tokens.push(new TOKEN('CHAR',string_so_far + char));
            structure = 'NONE';
            string_so_far = ''
            continue;
        }
        if(structure === 'COMP_STRING' && char !== BASE_255_STRING){
            string_so_far += char;
            continue;
        }
        if(structure === 'COMP_INT' && char !== BASE_255_INT){
            string_so_far += char;
            continue;
        }
        if(structure === 'STRING' && (char !== STRING_DELIMITER || escaped)){
            string_so_far += char;
            if(escaped) escaped = false 
            else if(char === '\\' && !escaped) escaped = true;
            continue;
        }
        if(!NUMBER_CHARS.includes(char) && structure == 'NUMBER' && string_so_far){
            tokens.push(new TOKEN('NUMBER',string_so_far))
            string_so_far = ''
        } 
        if(mod_count == 2 && struct_nest.length && struct_nest[struct_nest.length - 1].includes('PARALLEL')){
            tokens.push(new TOKEN('BRANCH',struct_nest[struct_nest.length - 1]))
        }
        if(mod_count == 1){
            if(struct_nest[struct_nest.length - 1].includes('PARALLEL')){
                tokens.push(new TOKEN('CLOSE_'+struct_nest[struct_nest.length - 1],''))
            } else {
                tokens.push(new TOKEN('CLOSE_MAP',struct_nest[struct_nest.length - 1]))
            }
            struct_nest.pop()
        }
        if(structure == 'SCC'){
            string_so_far += char;
            if(string_so_far.length == 2){
                structure = 'NONE';
                tokens.push(new TOKEN('STRING',`\`${string_so_far}\``))
            }
            continue;
        }
        if(mod_count) mod_count--;
        if(char === STRING_DELIMITER){            
            if(structure == 'STRING'){
                structure = 'NONE';
                tokens.push(new TOKEN('STRING',string_so_far + '`'));
                string_so_far = '';
            } else {
                structure = 'STRING'
                string_so_far = '`' 
            }
        } else if(NUMBER_CHARS.includes(char)){
            structure = 'NUMBER';
            string_so_far += char;
        } else if(char == BASE_255_STRING){
            if(structure == 'COMP_STRING'){
                structure = 'NONE';
                tokens.push(new TOKEN('COMP_STRING',string_so_far + '«'))
                string_so_far = '';
            } else {
                string_so_far = '«';
                structure = 'COMP_STRING';
            }
        } else if(char == BASE_255_INT){
            if(structure == 'COMP_INT'){
                structure = 'NONE';
                tokens.push(new TOKEN('COMP_INT',string_so_far + '»'))
                string_so_far = '';
            } else {
                string_so_far = '»';
                structure = 'COMP_INT';
            }
        } else if(MODIFIERS.includes(char)){
            structure = 'CHAR';
            string_so_far = char;
        } else if(char in OPENING){
            struct_nest.push(OPENING[char])
            tokens.push(new TOKEN(OPENING[char],''))
            structure = 'NONE'
        } else if(char in CLOSING){
            tokens.push(new TOKEN(CLOSING[char], struct_nest.pop()));
        } else if(char == '|'){
            if(struct_nest[struct_nest.length-1] == 'FOR'){
                tokens.pop()
                tokens.push(new TOKEN('FOR',active_code.replace(/\s/g,'')))
            }
            if(struct_nest[struct_nest.length-1] == 'LAMBDA'){
                tokens.pop()
                tokens.push(new TOKEN('LAMBDA',active_code.replace(/\s/g,'')))
            }
            tokens.push(new TOKEN('BRANCH',struct_nest[struct_nest.length-1]))
            structure = 'NONE'
        } else if(NOPS.includes(char)){
            structure = 'NONE'
        } else if(char in TWO_MODS){
            mod_count = 3;
            tokens.push(new TOKEN(TWO_MODS[char],''))
            struct_nest.push(TWO_MODS[char])
        } else if(char == THREE_MOD){
            tokens.push(new TOKEN('THREE_BYTE_LAMBDA',''))
            mod_count = 4;
            struct_nest.push('THREE_BYTE_LAMBDA')
        } else if(char == SCC){
            structure = 'SCC';
        } else {
            tokens.push(new TOKEN('ELEMENT',char))
            structure = 'NONE'
        }
        if(struct_nest[struct_nest.length-1] == 'FOR' && char != '|' && !string_so_far){
            active_code += char;
        } 
        if(struct_nest[struct_nest.length-1] == 'LAMBDA' && char != '|' && !string_so_far){
            active_code += char;
        }
    }
    if(structure !== 'NONE') tokens.push(new TOKEN(structure,string_so_far));
    for(i of struct_nest.reverse()) tokens.push(new TOKEN('CLOSE_' + (['LAMBDA','SORT_MAP','FILTER','TWO_BYTE_LAMBDA','THREE_BYTE_LAMBDA'].includes(i)?'MAP':i), i))
    return tokens
}