// src/infrastructure/firestore/collection.decorator.ts
// Decorator for marking a class as a Firestore collection (metadata only)
// No Firestore SDK or ORM logic allowed here

export function Collection(collectionName: string): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (constructor: Function) {
    Reflect.defineProperty(constructor, '__collectionName__', {
      value: collectionName,
      writable: false,
    });
  };
}
