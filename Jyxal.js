const parse = require('./JYparse').parse;
const commands = require('./commands');
function randID(){
    var output = 'VAR_';
    for(i=0;i<10;i++){
        output += Math.floor(Math.random() * 36).toString(36)
    }
    return output;
}
function add(lhs,rhs){
    if((typeof rhs == 'bigint' && typeof lhs == 'number') || (typeof rhs == 'number' && typeof lhs == 'bigint')){
        return Number(rhs) + Number(lhs)
    } else if((typeof lhs == typeof rhs) && !Array.isArray(lhs) ){
        return lhs + rhs
    } else if(Array.isArray(lhs) && Array.isArray(rhs)){
        if(lhs.length > rhs.length){ var list = lhs, other = rhs  } else var list = rhs, other = lhs;
        return list.map((val,index) => add(val,other[index] || 0))
    } else {
        if(Array.isArray(lhs)){ var list = lhs, other = rhs  } else var list = rhs, other = lhs;
        return list.map(val => add(val,other))
    }
}
function range(val){
    if(typeof val == 'bigint'){
        return [...Array(Number(val))].map((x,i) => BigInt(i))
    } else {
        return [...Array(val)].map((x,i) => i)
    }
}
function run(code,inputs){
    function last(arr){
        return arr[arr.length-1]
    }
    function pop(stack,num=1){
        function popRecurse(stack,num){
            if(!num) return []
            if(stack.length === 0){
                last(inputstack).unshift(last(inputstack).pop());
                return [last(inputstack)[0],...popRecurse(stack,num - 1,0)]
            } else {
                return [stack.pop(),...popRecurse(stack,num - 1)]
            }
        }
        var res = popRecurse(stack,num);
        if(res.length === 1) return res[0]
        return res
    }
    

    function array_wrap(val){
        if(Array.isArray(val)) return val
        return [val];
    }
    var output = '',
    compiled = '';
    stack = [],
    inputstack = [inputs];
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
                compiled += `var ${id2} = pop(stack); 
                if(typeof ${id2} == "number" || typeof ${id2} == "bigint") ${id2} = range(${id2});
                for(V_${id} of ${id2}){`
                    break;
            case 'CLOSE_FOR':
                compiled += '}'
                break;
            case 'BRANCH': 
                if(token.SOURCE == 'WHILE'){
                    compiled += 'if(pop(stack)) break;'
                }
                if(token.SOURCE == 'IF'){
                    compiled += '} else {'
                }
                if(token.SOURCE == 'LIST'){
                    compiled += 'temp_list.push(pop(stack));'
                }
                break;
            case 'WHILE':
                compiled += 'while(1) {';
                break;
            case 'CLOSE_WHILE': compiled += '}'; break;
            case 'IF': compiled += 'if(pop(stack)){'; break;
            case 'CLOSE_IF': compiled += '}'; break;
            case 'LIST': compiled += 'temp_list = [];'; break;
            case 'CLOSE_LIST': compiled += 'temp_list.push(pop(stack));stack.push(temp_list);'; break;
            case 'ELEMENT': compiled += commands[token.SOURCE]; break;
            case 'LAMBDA': 
                compiled += 'var arity = ' + (token.SOURCE || '"all"') +  '; var func = (stack) => {';
                break;
            case 'CLOSE_MAP':
                if(token.SOURCE == 'LAMBDA'){
                    compiled += '}; func.arity = arity; stack.push(func);';
                }
                break;
            case 'FUNC_DEF':
                compiled += `var arity = '${token.SOURCE}';`
                compiled += 'FUNC_' + token.SOURCE.split`:`[0] + ' = (stack) => {'
                break;
            case 'CLOSE_FUNC':
                compiled += 'return pop(stack)'
                compiled += `}; this['FUNC_' + arity.split(':')[0]].arity = arity;`
                break;
            case 'FUNC_CALL':
                compiled += `var temp_stack = [];
                 for(i of FUNC_${token.SOURCE}.arity.split(':').slice(1)){
                     if(+i===+i){
                         temp_stack.push(...array_wrap(x=pop(stack,+i)))
                         console.log(x)
                        } else {
                            this['V_'+i] = pop(stack)
                        }
                   }; inputstack.push(temp_stack); stack.push(FUNC_${token.SOURCE}([]));`
                   break;
            case 'FUNC_REF':
                compiled += `stack.push(FUNC_${token.SOURCE})`
                break;
            default: break;
        }
    }
    console.log(compiled);
    eval(compiled)
    //console.log(stack)
    console.log(output)
}

run('@ge:4|+++; 1 2 @ge; ,',[1n,2n])