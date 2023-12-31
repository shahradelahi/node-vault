export async function promisify(fn: () => Promise<any>): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log('--------------------- START ---------------------');
      await fn();
      console.log('--------------------- END ---------------------');
      console.log('');
      return resolve();
    } catch (e) {
      return reject(e);
    }
  });
}
