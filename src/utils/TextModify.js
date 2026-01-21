export const firstUpperCase = (text) => {
    const newText = text.toLowerCase();
    return newText.charAt(0).toUpperCase() + newText.slice(1);
}

export const groupFirstUpperCase = (text) => {
    const texts = text.split(" ");
    const newText = texts.map(txt => firstUpperCase(txt));
    return newText.join(" ");
}