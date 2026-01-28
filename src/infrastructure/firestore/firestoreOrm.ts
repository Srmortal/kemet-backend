// utils/firestoreOrm.ts
// Simple custom Firestore ORM abstraction for CRUD operations
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import {firebaseAdmin} from '@config/firebase';

export class FirestoreOrm<T extends { id?: string }> {
  private collectionName: string;
  private db: Firestore;

  /**
   * Returns the Firestore CollectionReference for advanced query building.
   * Usage:
   *   const query = orm.queryBuilder().where('field', '==', value).orderBy('createdAt', 'desc').limit(10);
   *   const snapshot = await query.get();
   *   const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
   */
  queryBuilder(): FirebaseFirestore.CollectionReference {
    return this.db.collection(this.collectionName);
  }

  /**
   * Construct with explicit collection name (legacy)
   */
  constructor(collectionName: string, db: Firestore = firebaseAdmin.firestore()) {
    this.collectionName = collectionName;
    this.db = db;
  }

  /**
   * Construct from a model class decorated with @Collection
   * Usage: FirestoreOrm.fromModel(UserModel)
   */
  static fromModel<U extends { id?: string }>(
    modelClass: { new (): U },
    db: Firestore = firebaseAdmin.firestore()
  ) {
    const desc = Reflect.getOwnPropertyDescriptor(modelClass, '__collectionName__');
    const collectionName = desc?.value;
    if (!collectionName) throw new Error('Model missing @Collection annotation');
    return new FirestoreOrm<U>(collectionName, db);
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const docRef = await this.db.collection(this.collectionName).add(data);
    const docSnap = await docRef.get();
    return { id: docRef.id, ...docSnap.data() } as T;
  }

  async getById(id: string): Promise<T | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as T;
  }

  async update(id: string, data: FirebaseFirestore.UpdateData<T>): Promise<T | null> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.update(data);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as T;
  }

  async delete(id: string): Promise<void> {
    await this.db.collection(this.collectionName).doc(id).delete();
  }

  async getAll(): Promise<T[]> {
    const snapshot = await this.db.collection(this.collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  /**
   * Find documents using a delegate function.
   * The delegate receives the Firestore CollectionReference and must return a Query.
   * Example:
   *   orm.findByDelegate(col => col.where('email', '==', 'test@example.com'))
   */
  async findByDelegate(
    delegate: (col: FirebaseFirestore.CollectionReference) => FirebaseFirestore.Query
  ): Promise<T[]> {
    const query = delegate(this.db.collection(this.collectionName));
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  /**
   * Find documents by filter object (simple AND queries).
   * Example: orm.find({ email: 'test@example.com', active: true })
   */
  async find(filter: Partial<T>): Promise<T[]> {
    let query: FirebaseFirestore.Query = this.db.collection(this.collectionName);

    for (const [field, value] of Object.entries(filter)) {
      query = query.where(field, '==', value);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  /**
   * Atomically update fields (e.g., increment/decrement).
   * Example: orm.updateFields(id, { quantity: FieldValue.increment(1) })
   */
  async updateFields(id: string, fields: FirebaseFirestore.UpdateData<T>): Promise<T | null> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    await docRef.update(fields);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as T;
  }

  /**
   * Increment a numeric field atomically.
   * Example: orm.increment(id, 'quantity', 1)
   */
  async increment(id: string, field: keyof T, amount: number = 1): Promise<T | null> {
    return this.updateFields(id, { [field]: FieldValue.increment(amount) } as FirebaseFirestore.UpdateData<T>);
  }

  /**
   * Decrement a numeric field atomically.
   * Example: orm.decrement(id, 'quantity', 1)
   */
  async decrement(id: string, field: keyof T, amount: number = 1): Promise<T | null> {
    return this.updateFields(id, { [field]: FieldValue.increment(-amount) } as FirebaseFirestore.UpdateData<T>);
  }

  /**
   * Update a document by delegate.
   * The delegate receives the current document (or null if not found) and returns the new data to merge.
   * Useful for complex/nested/subcollection updates.
   */
  async updateByDelegate(
    id: string,
    delegate: (current: T | null, docRef: FirebaseFirestore.DocumentReference) => Promise<FirebaseFirestore.UpdateData<T> | void> | FirebaseFirestore.UpdateData<T> | void
  ): Promise<T | null> {
    const docRef = this.db.collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();
    const current = docSnap.exists ? ({ id: docSnap.id, ...docSnap.data() } as T) : null;
    const updateData = await delegate(current, docRef);
    if (updateData && Object.keys(updateData).length > 0) {
      await docRef.update(updateData);
    }
    const updatedSnap = await docRef.get();
    if (!updatedSnap.exists) return null;
    return { id: updatedSnap.id, ...updatedSnap.data() } as T;
  }

  /**
   * Run a Firestore transaction on a document.
   * The delegate receives (currentDoc, docRef, transaction) and must return the new data to merge.
   */
  async runTransaction<R>(
    id: string,
    delegate: (
      current: T | null,
      docRef: FirebaseFirestore.DocumentReference,
      tx: FirebaseFirestore.Transaction
    ) => Promise<R>
  ): Promise<R> {
    const docRef = this.db.collection(this.collectionName).doc(id);

    return this.db.runTransaction(async tx => {
      const snap = await tx.get(docRef);
      const current = snap.exists
        ? ({ id: snap.id, ...snap.data() } as T)
        : null;

      return delegate(current, docRef, tx);
    });
  }
}
