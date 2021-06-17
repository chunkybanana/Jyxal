module.exports = {
    ':':'x = pop(stack); stack.push(x,x);',
    ',':'output += pop(stack) + "\\n";',
    'n':'stack.push(V_context_var); ',
    '‹':'stack.push(Number(pop(stack)) - 1);',
    '›':'stack.push(Number(pop(stack)) + 1);',
    '+':'[lhs,rhs] = pop(stack,2); stack.push(add(lhs,rhs)); console.log(rhs,lhs);'
}