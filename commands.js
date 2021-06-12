module.exports = {
    ':':'x = stack.pop(); stack.push(x,x);',
    ',':'output += stack.pop() + "\\n";',
    'n':'stack.push(V_context_var);',
    '‹':'stack.push(Number(stack.pop()) - 1);',
    '›':'stack.push(Number(stack.pop()) + 1);'
}