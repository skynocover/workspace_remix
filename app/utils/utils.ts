export const str2uuid = (input: string): string => {
  const temp = [];
  const cut = [0, 8, 12, 16, 20, input.length];
  for (let i = 0; i < cut.length - 1; i++) {
    temp.push(input.substring(cut[i], cut[i + 1]));
  }
  return temp.join("-");
};
