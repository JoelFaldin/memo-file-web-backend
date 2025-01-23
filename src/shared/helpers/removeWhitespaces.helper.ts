export const removeLastWhiteSpaces = (dir: string) => {
    const newDir = dir.split('').reverse();
    const direction = [dir.split('')];

    for(let i = 0; i < newDir.length; i++) {
        if (newDir[i] === ' ') {
            direction[0].pop();
        } else {
            break;
        }
    }

    return direction[0].join('');
}