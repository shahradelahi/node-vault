export function isJson(data: any): object | false {
  if (typeof data !== 'string') return false;
  if (data === '' || data[0] !== '{') return false;
  try {
    const val = JSON.parse(data);
    if (!val) return false;
    return val;
  } catch (e) {
    return false;
  }
}
