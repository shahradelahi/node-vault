export async function promisify(fn: () => Promise<any>): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log('Started...');
      await fn();
      console.log('Finish.');
      return resolve();
    } catch (e) {
      return reject(e);
    }
  });
}
