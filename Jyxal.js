const parse = require('./JYparse').parse;
const commands = require('./commands');
function randID(){
    var output = 'VAR_';
    for(i=0;i<80;i++){
        output += Math.floor(Math.random() * 36).toString(36)
    }
    return output;
}
function run(code){
    var output = '',
    compiled = '';
    stack = [];
    console.log(parse(code))
    for(token of parse(code)){
        switch(token.NAME){
            case 'NUMBER': 
                if(token.SOURCE.includes('.')){
                    compiled += `stack.push(${token.SOURCE});`;
                } else {
                    compiled += `stack.push(${token.SOURCE}n);`;
                }
                break;
            case 'STRING':
                compiled += `stack.push(${token.SOURCE});`;
                break;
            case 'FOR':
                var id = token.SOURCE || 'context_var', id2 = randID();
                compiled += `var ${id2} = stack.pop();
                if(typeof ${id2} == "number" || typeof ${id2} == "bigint") ${id2} = [...Array(Number(${id2})).keys()];
                for(V_${id} of ${id2}){`
                    break;
            case 'CLOSE_FOR':
                compiled += '}'
                break;
            case 'BRANCH': 
                if(token.SOURCE == 'WHILE'){
                    compiled += 'if(!stack.pop()) break;'
                }
                if(token.SOURCE == 'IF'){
                    compiled += '} else {'
                }
                if(token.SOURCE == 'LIST'){
                    compiled += 'temp_list.push(stack.pop());'
                }
                break;
            case 'WHILE':
                compiled += 'while(1) {';
                break;
            case 'CLOSE_WHILE': compiled += '}'; break;
            case 'IF': compiled += 'if(stack.pop()){'; break;
            case 'CLOSE_IF': compiled += '}'; break;
            case 'LIST': compiled += 'temp_list = [];'; break;
            case 'CLOSE_LIST': compiled += 'temp_list.push(stack.pop());stack.push(temp_list);'; break;
            case 'ELEMENT': compiled += commands[token.SOURCE]; break;
            case 'LAMBDA': 
                compiled += 'var arity = ' + (token.SOURCE || '"all"') +  '; var func = (...stack) => {';
                break;
            case 'CLOSE_MAP':
                if(token.SOURCE == 'LAMBDA'){
                    compiled += '}; func.arity = arity; stack.push(func);';
                }
                break;
            default: break;
        }
    }
    console.log(compiled);
    eval(compiled)
    //console.log(stack)
    console.log(output)
}

run('@a:b:c|:;')