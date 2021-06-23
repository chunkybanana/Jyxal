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
    console.log(lhs,rhs)
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
function lambda_sort(val,key){
    return val.map(n => [n,key(n)]).sort(([A,a],[B,b]) => a > b ? 1 : a < b ? -1 : 0).map(n => n[0]);
}
function lambda_map(val,func){
    if(typeof val == 'number' || typeof val == 'bigint'){
        val = range(val)
    } else if (typeof val == 'string'){
        var join = true;
        val = [...val]
    } 
    val = val.map(func);
    if(join) val = val.join('')
    return val;
}
function lambda_filt(val,func){
    if(typeof val == 'number' || typeof val == 'bigint'){
        val = range(val)
    } else if (typeof val == 'string'){
        var join = true;
        val = [...val]
    } 
    val = val.filter(func);
    if(join) val = val.join('')
    return val;
}
function sorted(val){
    if(typeof val === 'string'){
        return [...string].sort().join('')
    } else if(typeof val[0] === 'number' || typeof val[0] === 'bigint'){
        return val.sort((a,b)=>a-b)
    } else {
        return val;
    }
}
function range(val,inc){
    if(typeof val == 'bigint'){
        return [...Array(Number(val))].map((x,i) => BigInt(i) + BigInt(inc))
    } else if( typeof val == 'number') {
        return [...Array(val)].map((x,i) => i + inc)
    } 
    return val
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
    inputstack = [inputs.reverse()];
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
                compiled += `var arity = ${token.SOURCE || '1'} +  '; var func = (stack) => {`;
                break;
            case 'CLOSE_MAP':
                if(token.SOURCE == 'LAMBDA'){
                    compiled += '}; func.arity = arity; stack.push(func);';
                }
                if(token.SOURCE == 'MAP' || token.SOURCE == 'FILTER' || token.SOURCE == 'SORT_MAP'){
                    compiled += `
                    
                    var a = pop(stack)
                    inputstack.pop()
                    console.log(a)
                    return a;
                }));`
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
                   }; inputstack.push(temp_stack); stack.push(FUNC_${token.SOURCE}([])); inputstack.pop();`
                   break;
            case 'FUNC_REF':
                compiled += `stack.push(FUNC_${token.SOURCE})`
                break;
            case 'MAP':
                compiled += `stack.push(lambda_map(pop(stack),val => {
                    inputstack.push([val]);
                    V_context_var = val
                    var stack = [];`
                    break;
            case 'FILTER':
                compiled += `stack.push(lambda_filt(pop(stack),val => {
                    inputstack.push([val]);
                    V_context_var = val
                    var stack = [];`
                    break;
            case 'SORT_MAP':
                compiled += `stack.push(lambda_sort(pop(stack),val => {
                    inputstack.push([val]);
                    V_context_var = val
                    var stack = [];`

                break;
            case 'CHAR':
                var parsing_stack = [];
                while('vß⁽'.includes(token.SOURCE[0])){
                    parsing_stack.push(token.SOURCE[0]);
                    switch(token.SOURCE[0]){
                        case 'v': 
                        compiled += `var oldstack, k = stack;
                        var res = lambda_map(pop(stack),val => {
                            inputstack.push([null,...k,val]);
                            V_context_var = val
                            var stack = [];`;
                            break;
                        case 'ß': compiled += 'if(pop(stack)) { '; break;
                        case '⁽': compiled += `stack.push(stack => {`
                    }
                    token.SOURCE = token.SOURCE.slice(1)
                }
                compiled += commands[token.SOURCE];
                for(var x of parsing_stack){
                    switch(x){
                        case 'v': compiled += `
                    
                        var a = pop(stack)
                        oldstack = inputstack.pop()
                        console.log(a)
                        return a;
                    });
                    console.log(oldstack)
                    stack = [...oldstack.slice(oldstack.indexOf(null) + 1,oldstack.length),res]`; break;
                        case 'ß': compiled += '}'; break;
                        case '⁽': compiled += '})'; break;
                    }
                }
            default: break;
        }
    }
    console.log(compiled);
    eval(compiled)
    console.log(stack)
    console.log(output)
}

run('3 4 5.5 5 6⟨2|4|1|3|5⟩v+',[1n,2n])