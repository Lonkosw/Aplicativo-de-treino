/** Stubs mínimos: a verificação não exercita compartilhamento nem arquivos. */
export class File {
  constructor() {
    this.uri = 'file:///stub.json';
    this.name = 'stub.json';
    this.exists = false;
  }
  create() {}
  write() {}
  text() {
    return Promise.resolve('{}');
  }
  delete() {}
}

export const Paths = { cache: '/tmp', document: '/tmp' };

export function isAvailableAsync() {
  return Promise.resolve(false);
}
export function shareAsync() {
  return Promise.resolve();
}
export function getDocumentAsync() {
  return Promise.resolve({ canceled: true, assets: null });
}
