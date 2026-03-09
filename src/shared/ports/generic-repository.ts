export interface CreateRepository<TCreate, TCreated> {
  create(data: TCreate): Promise<TCreated>;
}

export interface UpdateRepository<
  TUpdate,
  TUpdated,
  TId = string,
  TNotFound = null,
> {
  update(id: TId, data: TUpdate): Promise<TUpdated | TNotFound>;
}

export interface DeleteRepository<TId = string, TResult = void> {
  delete(id: TId): Promise<TResult>;
}

export interface CreateBookingRepository<TCreate, TCreated> {
  createBooking(booking: TCreate): Promise<TCreated>;
}

export interface FindByIdRepository<TEntity, TId = string, TNotFound = null> {
  findById(id: TId): Promise<TEntity | TNotFound>;
}

export interface FindOneRepository<TFilter, TEntity, TNotFound = null> {
  findOne(filter: TFilter): Promise<TEntity | TNotFound>;
}

export interface FindManyRepository<TFilter, TEntity> {
  find(filter: TFilter): Promise<TEntity[]>;
}

export interface GetAllRepository<TEntity> {
  getAll(): Promise<TEntity[]>;
}

export interface GetAllWithOptionsRepository<TEntity, TOptions> {
  getAll(options: TOptions): Promise<TEntity[]>;
}

export interface GetAllBookingsRepository<TBooking> {
  getAllBookings(): Promise<TBooking[]>;
}

export type CreateMethodRepository<
  TMethodName extends string,
  TCreate,
  TCreated,
> = {
  [K in TMethodName]: (data: TCreate) => Promise<TCreated>;
};

export type UpdateMethodRepository<
  TMethodName extends string,
  TUpdate,
  TUpdated,
  TId = string,
  TNotFound = null,
> = {
  [K in TMethodName]: (id: TId, data: TUpdate) => Promise<TUpdated | TNotFound>;
};

export type DeleteMethodRepository<
  TMethodName extends string,
  TId = string,
  TResult = void,
> = {
  [K in TMethodName]: (id: TId) => Promise<TResult>;
};

export type GetByIdMethodRepository<
  TMethodName extends string,
  TEntity,
  TId = string,
  TNotFound = null,
> = {
  [K in TMethodName]: (id: TId) => Promise<TEntity | TNotFound>;
};

export type FindOneMethodRepository<
  TMethodName extends string,
  TFilter,
  TEntity,
  TNotFound = null,
> = {
  [K in TMethodName]: (filter: TFilter) => Promise<TEntity | TNotFound>;
};

export type FindManyMethodRepository<
  TMethodName extends string,
  TFilter,
  TEntity,
> = {
  [K in TMethodName]: (filter: TFilter) => Promise<TEntity[]>;
};

export type GetAllMethodRepository<TMethodName extends string, TEntity> = {
  [K in TMethodName]: () => Promise<TEntity[]>;
};
