
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model user
 * 
 */
export type user = $Result.DefaultSelection<Prisma.$userPayload>
/**
 * Model student_profile
 * 
 */
export type student_profile = $Result.DefaultSelection<Prisma.$student_profilePayload>
/**
 * Model exam
 * 
 */
export type exam = $Result.DefaultSelection<Prisma.$examPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const ExamName: {
  JEE_MAIN: 'JEE_MAIN',
  JEE_ADVANCED: 'JEE_ADVANCED'
};

export type ExamName = (typeof ExamName)[keyof typeof ExamName]


export const Study_mode: {
  online: 'online',
  offline: 'offline',
  self: 'self'
};

export type Study_mode = (typeof Study_mode)[keyof typeof Study_mode]

}

export type ExamName = $Enums.ExamName

export const ExamName: typeof $Enums.ExamName

export type Study_mode = $Enums.Study_mode

export const Study_mode: typeof $Enums.Study_mode

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **user** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.userDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.student_profile`: Exposes CRUD operations for the **student_profile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Student_profiles
    * const student_profiles = await prisma.student_profile.findMany()
    * ```
    */
  get student_profile(): Prisma.student_profileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.exam`: Exposes CRUD operations for the **exam** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Exams
    * const exams = await prisma.exam.findMany()
    * ```
    */
  get exam(): Prisma.examDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.0.1
   * Query Engine version: f09f2815f091dbba658cdcd2264306d88bb5bda6
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    user: 'user',
    student_profile: 'student_profile',
    exam: 'exam'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "student_profile" | "exam"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      user: {
        payload: Prisma.$userPayload<ExtArgs>
        fields: Prisma.userFieldRefs
        operations: {
          findUnique: {
            args: Prisma.userFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.userFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          findFirst: {
            args: Prisma.userFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.userFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          findMany: {
            args: Prisma.userFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>[]
          }
          create: {
            args: Prisma.userCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          createMany: {
            args: Prisma.userCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.userCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>[]
          }
          delete: {
            args: Prisma.userDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          update: {
            args: Prisma.userUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          deleteMany: {
            args: Prisma.userDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.userUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.userUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>[]
          }
          upsert: {
            args: Prisma.userUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$userPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.userGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.userCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      student_profile: {
        payload: Prisma.$student_profilePayload<ExtArgs>
        fields: Prisma.student_profileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.student_profileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$student_profilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.student_profileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$student_profilePayload>
          }
          findFirst: {
            args: Prisma.student_profileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$student_profilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.student_profileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$student_profilePayload>
          }
          findMany: {
            args: Prisma.student_profileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$student_profilePayload>[]
          }
          create: {
            args: Prisma.student_profileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$student_profilePayload>
          }
          createMany: {
            args: Prisma.student_profileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.student_profileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$student_profilePayload>[]
          }
          delete: {
            args: Prisma.student_profileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$student_profilePayload>
          }
          update: {
            args: Prisma.student_profileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$student_profilePayload>
          }
          deleteMany: {
            args: Prisma.student_profileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.student_profileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.student_profileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$student_profilePayload>[]
          }
          upsert: {
            args: Prisma.student_profileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$student_profilePayload>
          }
          aggregate: {
            args: Prisma.Student_profileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStudent_profile>
          }
          groupBy: {
            args: Prisma.student_profileGroupByArgs<ExtArgs>
            result: $Utils.Optional<Student_profileGroupByOutputType>[]
          }
          count: {
            args: Prisma.student_profileCountArgs<ExtArgs>
            result: $Utils.Optional<Student_profileCountAggregateOutputType> | number
          }
        }
      }
      exam: {
        payload: Prisma.$examPayload<ExtArgs>
        fields: Prisma.examFieldRefs
        operations: {
          findUnique: {
            args: Prisma.examFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$examPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.examFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$examPayload>
          }
          findFirst: {
            args: Prisma.examFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$examPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.examFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$examPayload>
          }
          findMany: {
            args: Prisma.examFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$examPayload>[]
          }
          create: {
            args: Prisma.examCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$examPayload>
          }
          createMany: {
            args: Prisma.examCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.examCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$examPayload>[]
          }
          delete: {
            args: Prisma.examDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$examPayload>
          }
          update: {
            args: Prisma.examUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$examPayload>
          }
          deleteMany: {
            args: Prisma.examDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.examUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.examUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$examPayload>[]
          }
          upsert: {
            args: Prisma.examUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$examPayload>
          }
          aggregate: {
            args: Prisma.ExamAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateExam>
          }
          groupBy: {
            args: Prisma.examGroupByArgs<ExtArgs>
            result: $Utils.Optional<ExamGroupByOutputType>[]
          }
          count: {
            args: Prisma.examCountArgs<ExtArgs>
            result: $Utils.Optional<ExamCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: userOmit
    student_profile?: student_profileOmit
    exam?: examOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model user
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    password: string | null
    refersh_token: string | null
    created_at: Date | null
    is_verified: boolean | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    password: string | null
    refersh_token: string | null
    created_at: Date | null
    is_verified: boolean | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    name: number
    email: number
    password: number
    refersh_token: number
    created_at: number
    is_verified: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password?: true
    refersh_token?: true
    created_at?: true
    is_verified?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password?: true
    refersh_token?: true
    created_at?: true
    is_verified?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password?: true
    refersh_token?: true
    created_at?: true
    is_verified?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which user to aggregate.
     */
    where?: userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of users to fetch.
     */
    orderBy?: userOrderByWithRelationInput | userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type userGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: userWhereInput
    orderBy?: userOrderByWithAggregationInput | userOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: userScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    name: string
    email: string
    password: string
    refersh_token: string | null
    created_at: Date
    is_verified: boolean
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends userGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type userSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    refersh_token?: boolean
    created_at?: boolean
    is_verified?: boolean
    student_profile?: boolean | user$student_profileArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type userSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    refersh_token?: boolean
    created_at?: boolean
    is_verified?: boolean
  }, ExtArgs["result"]["user"]>

  export type userSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    refersh_token?: boolean
    created_at?: boolean
    is_verified?: boolean
  }, ExtArgs["result"]["user"]>

  export type userSelectScalar = {
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    refersh_token?: boolean
    created_at?: boolean
    is_verified?: boolean
  }

  export type userOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "email" | "password" | "refersh_token" | "created_at" | "is_verified", ExtArgs["result"]["user"]>
  export type userInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    student_profile?: boolean | user$student_profileArgs<ExtArgs>
  }
  export type userIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type userIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $userPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "user"
    objects: {
      student_profile: Prisma.$student_profilePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      email: string
      password: string
      refersh_token: string | null
      created_at: Date
      is_verified: boolean
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type userGetPayload<S extends boolean | null | undefined | userDefaultArgs> = $Result.GetResult<Prisma.$userPayload, S>

  type userCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<userFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface userDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['user'], meta: { name: 'user' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {userFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends userFindUniqueArgs>(args: SelectSubset<T, userFindUniqueArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {userFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends userFindUniqueOrThrowArgs>(args: SelectSubset<T, userFindUniqueOrThrowArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends userFindFirstArgs>(args?: SelectSubset<T, userFindFirstArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends userFindFirstOrThrowArgs>(args?: SelectSubset<T, userFindFirstOrThrowArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends userFindManyArgs>(args?: SelectSubset<T, userFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {userCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends userCreateArgs>(args: SelectSubset<T, userCreateArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {userCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends userCreateManyArgs>(args?: SelectSubset<T, userCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {userCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends userCreateManyAndReturnArgs>(args?: SelectSubset<T, userCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {userDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends userDeleteArgs>(args: SelectSubset<T, userDeleteArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {userUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends userUpdateArgs>(args: SelectSubset<T, userUpdateArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {userDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends userDeleteManyArgs>(args?: SelectSubset<T, userDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends userUpdateManyArgs>(args: SelectSubset<T, userUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {userUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends userUpdateManyAndReturnArgs>(args: SelectSubset<T, userUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {userUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends userUpsertArgs>(args: SelectSubset<T, userUpsertArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends userCountArgs>(
      args?: Subset<T, userCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {userGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends userGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: userGroupByArgs['orderBy'] }
        : { orderBy?: userGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, userGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the user model
   */
  readonly fields: userFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for user.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__userClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    student_profile<T extends user$student_profileArgs<ExtArgs> = {}>(args?: Subset<T, user$student_profileArgs<ExtArgs>>): Prisma__student_profileClient<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the user model
   */
  interface userFieldRefs {
    readonly id: FieldRef<"user", 'String'>
    readonly name: FieldRef<"user", 'String'>
    readonly email: FieldRef<"user", 'String'>
    readonly password: FieldRef<"user", 'String'>
    readonly refersh_token: FieldRef<"user", 'String'>
    readonly created_at: FieldRef<"user", 'DateTime'>
    readonly is_verified: FieldRef<"user", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * user findUnique
   */
  export type userFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter, which user to fetch.
     */
    where: userWhereUniqueInput
  }

  /**
   * user findUniqueOrThrow
   */
  export type userFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter, which user to fetch.
     */
    where: userWhereUniqueInput
  }

  /**
   * user findFirst
   */
  export type userFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter, which user to fetch.
     */
    where?: userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of users to fetch.
     */
    orderBy?: userOrderByWithRelationInput | userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for users.
     */
    cursor?: userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * user findFirstOrThrow
   */
  export type userFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter, which user to fetch.
     */
    where?: userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of users to fetch.
     */
    orderBy?: userOrderByWithRelationInput | userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for users.
     */
    cursor?: userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * user findMany
   */
  export type userFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter, which users to fetch.
     */
    where?: userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of users to fetch.
     */
    orderBy?: userOrderByWithRelationInput | userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing users.
     */
    cursor?: userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * user create
   */
  export type userCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * The data needed to create a user.
     */
    data: XOR<userCreateInput, userUncheckedCreateInput>
  }

  /**
   * user createMany
   */
  export type userCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many users.
     */
    data: userCreateManyInput | userCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * user createManyAndReturn
   */
  export type userCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * The data used to create many users.
     */
    data: userCreateManyInput | userCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * user update
   */
  export type userUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * The data needed to update a user.
     */
    data: XOR<userUpdateInput, userUncheckedUpdateInput>
    /**
     * Choose, which user to update.
     */
    where: userWhereUniqueInput
  }

  /**
   * user updateMany
   */
  export type userUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update users.
     */
    data: XOR<userUpdateManyMutationInput, userUncheckedUpdateManyInput>
    /**
     * Filter which users to update
     */
    where?: userWhereInput
    /**
     * Limit how many users to update.
     */
    limit?: number
  }

  /**
   * user updateManyAndReturn
   */
  export type userUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * The data used to update users.
     */
    data: XOR<userUpdateManyMutationInput, userUncheckedUpdateManyInput>
    /**
     * Filter which users to update
     */
    where?: userWhereInput
    /**
     * Limit how many users to update.
     */
    limit?: number
  }

  /**
   * user upsert
   */
  export type userUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * The filter to search for the user to update in case it exists.
     */
    where: userWhereUniqueInput
    /**
     * In case the user found by the `where` argument doesn't exist, create a new user with this data.
     */
    create: XOR<userCreateInput, userUncheckedCreateInput>
    /**
     * In case the user was found with the provided `where` argument, update it with this data.
     */
    update: XOR<userUpdateInput, userUncheckedUpdateInput>
  }

  /**
   * user delete
   */
  export type userDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
    /**
     * Filter which user to delete.
     */
    where: userWhereUniqueInput
  }

  /**
   * user deleteMany
   */
  export type userDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which users to delete
     */
    where?: userWhereInput
    /**
     * Limit how many users to delete.
     */
    limit?: number
  }

  /**
   * user.student_profile
   */
  export type user$student_profileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileInclude<ExtArgs> | null
    where?: student_profileWhereInput
  }

  /**
   * user without action
   */
  export type userDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the user
     */
    select?: userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the user
     */
    omit?: userOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: userInclude<ExtArgs> | null
  }


  /**
   * Model student_profile
   */

  export type AggregateStudent_profile = {
    _count: Student_profileCountAggregateOutputType | null
    _avg: Student_profileAvgAggregateOutputType | null
    _sum: Student_profileSumAggregateOutputType | null
    _min: Student_profileMinAggregateOutputType | null
    _max: Student_profileMaxAggregateOutputType | null
  }

  export type Student_profileAvgAggregateOutputType = {
    class: number | null
    phone: number | null
  }

  export type Student_profileSumAggregateOutputType = {
    class: number | null
    phone: bigint | null
  }

  export type Student_profileMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    class: number | null
    study_mode: $Enums.Study_mode | null
    institution: string | null
    phone: bigint | null
    phone_country_code: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Student_profileMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    class: number | null
    study_mode: $Enums.Study_mode | null
    institution: string | null
    phone: bigint | null
    phone_country_code: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Student_profileCountAggregateOutputType = {
    id: number
    user_id: number
    class: number
    study_mode: number
    institution: number
    phone: number
    phone_country_code: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type Student_profileAvgAggregateInputType = {
    class?: true
    phone?: true
  }

  export type Student_profileSumAggregateInputType = {
    class?: true
    phone?: true
  }

  export type Student_profileMinAggregateInputType = {
    id?: true
    user_id?: true
    class?: true
    study_mode?: true
    institution?: true
    phone?: true
    phone_country_code?: true
    created_at?: true
    updated_at?: true
  }

  export type Student_profileMaxAggregateInputType = {
    id?: true
    user_id?: true
    class?: true
    study_mode?: true
    institution?: true
    phone?: true
    phone_country_code?: true
    created_at?: true
    updated_at?: true
  }

  export type Student_profileCountAggregateInputType = {
    id?: true
    user_id?: true
    class?: true
    study_mode?: true
    institution?: true
    phone?: true
    phone_country_code?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type Student_profileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which student_profile to aggregate.
     */
    where?: student_profileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of student_profiles to fetch.
     */
    orderBy?: student_profileOrderByWithRelationInput | student_profileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: student_profileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` student_profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` student_profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned student_profiles
    **/
    _count?: true | Student_profileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Student_profileAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Student_profileSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Student_profileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Student_profileMaxAggregateInputType
  }

  export type GetStudent_profileAggregateType<T extends Student_profileAggregateArgs> = {
        [P in keyof T & keyof AggregateStudent_profile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStudent_profile[P]>
      : GetScalarType<T[P], AggregateStudent_profile[P]>
  }




  export type student_profileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: student_profileWhereInput
    orderBy?: student_profileOrderByWithAggregationInput | student_profileOrderByWithAggregationInput[]
    by: Student_profileScalarFieldEnum[] | Student_profileScalarFieldEnum
    having?: student_profileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Student_profileCountAggregateInputType | true
    _avg?: Student_profileAvgAggregateInputType
    _sum?: Student_profileSumAggregateInputType
    _min?: Student_profileMinAggregateInputType
    _max?: Student_profileMaxAggregateInputType
  }

  export type Student_profileGroupByOutputType = {
    id: string
    user_id: string
    class: number
    study_mode: $Enums.Study_mode | null
    institution: string | null
    phone: bigint | null
    phone_country_code: string | null
    created_at: Date
    updated_at: Date
    _count: Student_profileCountAggregateOutputType | null
    _avg: Student_profileAvgAggregateOutputType | null
    _sum: Student_profileSumAggregateOutputType | null
    _min: Student_profileMinAggregateOutputType | null
    _max: Student_profileMaxAggregateOutputType | null
  }

  type GetStudent_profileGroupByPayload<T extends student_profileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Student_profileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Student_profileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Student_profileGroupByOutputType[P]>
            : GetScalarType<T[P], Student_profileGroupByOutputType[P]>
        }
      >
    >


  export type student_profileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    class?: boolean
    study_mode?: boolean
    institution?: boolean
    phone?: boolean
    phone_country_code?: boolean
    created_at?: boolean
    updated_at?: boolean
    user?: boolean | userDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["student_profile"]>

  export type student_profileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    class?: boolean
    study_mode?: boolean
    institution?: boolean
    phone?: boolean
    phone_country_code?: boolean
    created_at?: boolean
    updated_at?: boolean
    user?: boolean | userDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["student_profile"]>

  export type student_profileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    class?: boolean
    study_mode?: boolean
    institution?: boolean
    phone?: boolean
    phone_country_code?: boolean
    created_at?: boolean
    updated_at?: boolean
    user?: boolean | userDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["student_profile"]>

  export type student_profileSelectScalar = {
    id?: boolean
    user_id?: boolean
    class?: boolean
    study_mode?: boolean
    institution?: boolean
    phone?: boolean
    phone_country_code?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type student_profileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "class" | "study_mode" | "institution" | "phone" | "phone_country_code" | "created_at" | "updated_at", ExtArgs["result"]["student_profile"]>
  export type student_profileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | userDefaultArgs<ExtArgs>
  }
  export type student_profileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | userDefaultArgs<ExtArgs>
  }
  export type student_profileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | userDefaultArgs<ExtArgs>
  }

  export type $student_profilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "student_profile"
    objects: {
      user: Prisma.$userPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      class: number
      study_mode: $Enums.Study_mode | null
      institution: string | null
      phone: bigint | null
      phone_country_code: string | null
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["student_profile"]>
    composites: {}
  }

  type student_profileGetPayload<S extends boolean | null | undefined | student_profileDefaultArgs> = $Result.GetResult<Prisma.$student_profilePayload, S>

  type student_profileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<student_profileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Student_profileCountAggregateInputType | true
    }

  export interface student_profileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['student_profile'], meta: { name: 'student_profile' } }
    /**
     * Find zero or one Student_profile that matches the filter.
     * @param {student_profileFindUniqueArgs} args - Arguments to find a Student_profile
     * @example
     * // Get one Student_profile
     * const student_profile = await prisma.student_profile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends student_profileFindUniqueArgs>(args: SelectSubset<T, student_profileFindUniqueArgs<ExtArgs>>): Prisma__student_profileClient<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Student_profile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {student_profileFindUniqueOrThrowArgs} args - Arguments to find a Student_profile
     * @example
     * // Get one Student_profile
     * const student_profile = await prisma.student_profile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends student_profileFindUniqueOrThrowArgs>(args: SelectSubset<T, student_profileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__student_profileClient<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Student_profile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {student_profileFindFirstArgs} args - Arguments to find a Student_profile
     * @example
     * // Get one Student_profile
     * const student_profile = await prisma.student_profile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends student_profileFindFirstArgs>(args?: SelectSubset<T, student_profileFindFirstArgs<ExtArgs>>): Prisma__student_profileClient<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Student_profile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {student_profileFindFirstOrThrowArgs} args - Arguments to find a Student_profile
     * @example
     * // Get one Student_profile
     * const student_profile = await prisma.student_profile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends student_profileFindFirstOrThrowArgs>(args?: SelectSubset<T, student_profileFindFirstOrThrowArgs<ExtArgs>>): Prisma__student_profileClient<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Student_profiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {student_profileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Student_profiles
     * const student_profiles = await prisma.student_profile.findMany()
     * 
     * // Get first 10 Student_profiles
     * const student_profiles = await prisma.student_profile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const student_profileWithIdOnly = await prisma.student_profile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends student_profileFindManyArgs>(args?: SelectSubset<T, student_profileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Student_profile.
     * @param {student_profileCreateArgs} args - Arguments to create a Student_profile.
     * @example
     * // Create one Student_profile
     * const Student_profile = await prisma.student_profile.create({
     *   data: {
     *     // ... data to create a Student_profile
     *   }
     * })
     * 
     */
    create<T extends student_profileCreateArgs>(args: SelectSubset<T, student_profileCreateArgs<ExtArgs>>): Prisma__student_profileClient<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Student_profiles.
     * @param {student_profileCreateManyArgs} args - Arguments to create many Student_profiles.
     * @example
     * // Create many Student_profiles
     * const student_profile = await prisma.student_profile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends student_profileCreateManyArgs>(args?: SelectSubset<T, student_profileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Student_profiles and returns the data saved in the database.
     * @param {student_profileCreateManyAndReturnArgs} args - Arguments to create many Student_profiles.
     * @example
     * // Create many Student_profiles
     * const student_profile = await prisma.student_profile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Student_profiles and only return the `id`
     * const student_profileWithIdOnly = await prisma.student_profile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends student_profileCreateManyAndReturnArgs>(args?: SelectSubset<T, student_profileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Student_profile.
     * @param {student_profileDeleteArgs} args - Arguments to delete one Student_profile.
     * @example
     * // Delete one Student_profile
     * const Student_profile = await prisma.student_profile.delete({
     *   where: {
     *     // ... filter to delete one Student_profile
     *   }
     * })
     * 
     */
    delete<T extends student_profileDeleteArgs>(args: SelectSubset<T, student_profileDeleteArgs<ExtArgs>>): Prisma__student_profileClient<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Student_profile.
     * @param {student_profileUpdateArgs} args - Arguments to update one Student_profile.
     * @example
     * // Update one Student_profile
     * const student_profile = await prisma.student_profile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends student_profileUpdateArgs>(args: SelectSubset<T, student_profileUpdateArgs<ExtArgs>>): Prisma__student_profileClient<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Student_profiles.
     * @param {student_profileDeleteManyArgs} args - Arguments to filter Student_profiles to delete.
     * @example
     * // Delete a few Student_profiles
     * const { count } = await prisma.student_profile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends student_profileDeleteManyArgs>(args?: SelectSubset<T, student_profileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Student_profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {student_profileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Student_profiles
     * const student_profile = await prisma.student_profile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends student_profileUpdateManyArgs>(args: SelectSubset<T, student_profileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Student_profiles and returns the data updated in the database.
     * @param {student_profileUpdateManyAndReturnArgs} args - Arguments to update many Student_profiles.
     * @example
     * // Update many Student_profiles
     * const student_profile = await prisma.student_profile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Student_profiles and only return the `id`
     * const student_profileWithIdOnly = await prisma.student_profile.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends student_profileUpdateManyAndReturnArgs>(args: SelectSubset<T, student_profileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Student_profile.
     * @param {student_profileUpsertArgs} args - Arguments to update or create a Student_profile.
     * @example
     * // Update or create a Student_profile
     * const student_profile = await prisma.student_profile.upsert({
     *   create: {
     *     // ... data to create a Student_profile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Student_profile we want to update
     *   }
     * })
     */
    upsert<T extends student_profileUpsertArgs>(args: SelectSubset<T, student_profileUpsertArgs<ExtArgs>>): Prisma__student_profileClient<$Result.GetResult<Prisma.$student_profilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Student_profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {student_profileCountArgs} args - Arguments to filter Student_profiles to count.
     * @example
     * // Count the number of Student_profiles
     * const count = await prisma.student_profile.count({
     *   where: {
     *     // ... the filter for the Student_profiles we want to count
     *   }
     * })
    **/
    count<T extends student_profileCountArgs>(
      args?: Subset<T, student_profileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Student_profileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Student_profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Student_profileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Student_profileAggregateArgs>(args: Subset<T, Student_profileAggregateArgs>): Prisma.PrismaPromise<GetStudent_profileAggregateType<T>>

    /**
     * Group by Student_profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {student_profileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends student_profileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: student_profileGroupByArgs['orderBy'] }
        : { orderBy?: student_profileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, student_profileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStudent_profileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the student_profile model
   */
  readonly fields: student_profileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for student_profile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__student_profileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends userDefaultArgs<ExtArgs> = {}>(args?: Subset<T, userDefaultArgs<ExtArgs>>): Prisma__userClient<$Result.GetResult<Prisma.$userPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the student_profile model
   */
  interface student_profileFieldRefs {
    readonly id: FieldRef<"student_profile", 'String'>
    readonly user_id: FieldRef<"student_profile", 'String'>
    readonly class: FieldRef<"student_profile", 'Int'>
    readonly study_mode: FieldRef<"student_profile", 'Study_mode'>
    readonly institution: FieldRef<"student_profile", 'String'>
    readonly phone: FieldRef<"student_profile", 'BigInt'>
    readonly phone_country_code: FieldRef<"student_profile", 'String'>
    readonly created_at: FieldRef<"student_profile", 'DateTime'>
    readonly updated_at: FieldRef<"student_profile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * student_profile findUnique
   */
  export type student_profileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileInclude<ExtArgs> | null
    /**
     * Filter, which student_profile to fetch.
     */
    where: student_profileWhereUniqueInput
  }

  /**
   * student_profile findUniqueOrThrow
   */
  export type student_profileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileInclude<ExtArgs> | null
    /**
     * Filter, which student_profile to fetch.
     */
    where: student_profileWhereUniqueInput
  }

  /**
   * student_profile findFirst
   */
  export type student_profileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileInclude<ExtArgs> | null
    /**
     * Filter, which student_profile to fetch.
     */
    where?: student_profileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of student_profiles to fetch.
     */
    orderBy?: student_profileOrderByWithRelationInput | student_profileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for student_profiles.
     */
    cursor?: student_profileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` student_profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` student_profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of student_profiles.
     */
    distinct?: Student_profileScalarFieldEnum | Student_profileScalarFieldEnum[]
  }

  /**
   * student_profile findFirstOrThrow
   */
  export type student_profileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileInclude<ExtArgs> | null
    /**
     * Filter, which student_profile to fetch.
     */
    where?: student_profileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of student_profiles to fetch.
     */
    orderBy?: student_profileOrderByWithRelationInput | student_profileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for student_profiles.
     */
    cursor?: student_profileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` student_profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` student_profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of student_profiles.
     */
    distinct?: Student_profileScalarFieldEnum | Student_profileScalarFieldEnum[]
  }

  /**
   * student_profile findMany
   */
  export type student_profileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileInclude<ExtArgs> | null
    /**
     * Filter, which student_profiles to fetch.
     */
    where?: student_profileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of student_profiles to fetch.
     */
    orderBy?: student_profileOrderByWithRelationInput | student_profileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing student_profiles.
     */
    cursor?: student_profileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` student_profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` student_profiles.
     */
    skip?: number
    distinct?: Student_profileScalarFieldEnum | Student_profileScalarFieldEnum[]
  }

  /**
   * student_profile create
   */
  export type student_profileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileInclude<ExtArgs> | null
    /**
     * The data needed to create a student_profile.
     */
    data: XOR<student_profileCreateInput, student_profileUncheckedCreateInput>
  }

  /**
   * student_profile createMany
   */
  export type student_profileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many student_profiles.
     */
    data: student_profileCreateManyInput | student_profileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * student_profile createManyAndReturn
   */
  export type student_profileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * The data used to create many student_profiles.
     */
    data: student_profileCreateManyInput | student_profileCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * student_profile update
   */
  export type student_profileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileInclude<ExtArgs> | null
    /**
     * The data needed to update a student_profile.
     */
    data: XOR<student_profileUpdateInput, student_profileUncheckedUpdateInput>
    /**
     * Choose, which student_profile to update.
     */
    where: student_profileWhereUniqueInput
  }

  /**
   * student_profile updateMany
   */
  export type student_profileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update student_profiles.
     */
    data: XOR<student_profileUpdateManyMutationInput, student_profileUncheckedUpdateManyInput>
    /**
     * Filter which student_profiles to update
     */
    where?: student_profileWhereInput
    /**
     * Limit how many student_profiles to update.
     */
    limit?: number
  }

  /**
   * student_profile updateManyAndReturn
   */
  export type student_profileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * The data used to update student_profiles.
     */
    data: XOR<student_profileUpdateManyMutationInput, student_profileUncheckedUpdateManyInput>
    /**
     * Filter which student_profiles to update
     */
    where?: student_profileWhereInput
    /**
     * Limit how many student_profiles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * student_profile upsert
   */
  export type student_profileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileInclude<ExtArgs> | null
    /**
     * The filter to search for the student_profile to update in case it exists.
     */
    where: student_profileWhereUniqueInput
    /**
     * In case the student_profile found by the `where` argument doesn't exist, create a new student_profile with this data.
     */
    create: XOR<student_profileCreateInput, student_profileUncheckedCreateInput>
    /**
     * In case the student_profile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<student_profileUpdateInput, student_profileUncheckedUpdateInput>
  }

  /**
   * student_profile delete
   */
  export type student_profileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileInclude<ExtArgs> | null
    /**
     * Filter which student_profile to delete.
     */
    where: student_profileWhereUniqueInput
  }

  /**
   * student_profile deleteMany
   */
  export type student_profileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which student_profiles to delete
     */
    where?: student_profileWhereInput
    /**
     * Limit how many student_profiles to delete.
     */
    limit?: number
  }

  /**
   * student_profile without action
   */
  export type student_profileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the student_profile
     */
    select?: student_profileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the student_profile
     */
    omit?: student_profileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: student_profileInclude<ExtArgs> | null
  }


  /**
   * Model exam
   */

  export type AggregateExam = {
    _count: ExamCountAggregateOutputType | null
    _min: ExamMinAggregateOutputType | null
    _max: ExamMaxAggregateOutputType | null
  }

  export type ExamMinAggregateOutputType = {
    id: string | null
    name: $Enums.ExamName | null
    updated_at: Date | null
  }

  export type ExamMaxAggregateOutputType = {
    id: string | null
    name: $Enums.ExamName | null
    updated_at: Date | null
  }

  export type ExamCountAggregateOutputType = {
    id: number
    name: number
    updated_at: number
    _all: number
  }


  export type ExamMinAggregateInputType = {
    id?: true
    name?: true
    updated_at?: true
  }

  export type ExamMaxAggregateInputType = {
    id?: true
    name?: true
    updated_at?: true
  }

  export type ExamCountAggregateInputType = {
    id?: true
    name?: true
    updated_at?: true
    _all?: true
  }

  export type ExamAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which exam to aggregate.
     */
    where?: examWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of exams to fetch.
     */
    orderBy?: examOrderByWithRelationInput | examOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: examWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` exams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` exams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned exams
    **/
    _count?: true | ExamCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ExamMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ExamMaxAggregateInputType
  }

  export type GetExamAggregateType<T extends ExamAggregateArgs> = {
        [P in keyof T & keyof AggregateExam]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateExam[P]>
      : GetScalarType<T[P], AggregateExam[P]>
  }




  export type examGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: examWhereInput
    orderBy?: examOrderByWithAggregationInput | examOrderByWithAggregationInput[]
    by: ExamScalarFieldEnum[] | ExamScalarFieldEnum
    having?: examScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ExamCountAggregateInputType | true
    _min?: ExamMinAggregateInputType
    _max?: ExamMaxAggregateInputType
  }

  export type ExamGroupByOutputType = {
    id: string
    name: $Enums.ExamName
    updated_at: Date
    _count: ExamCountAggregateOutputType | null
    _min: ExamMinAggregateOutputType | null
    _max: ExamMaxAggregateOutputType | null
  }

  type GetExamGroupByPayload<T extends examGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ExamGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ExamGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ExamGroupByOutputType[P]>
            : GetScalarType<T[P], ExamGroupByOutputType[P]>
        }
      >
    >


  export type examSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["exam"]>

  export type examSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["exam"]>

  export type examSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["exam"]>

  export type examSelectScalar = {
    id?: boolean
    name?: boolean
    updated_at?: boolean
  }

  export type examOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "updated_at", ExtArgs["result"]["exam"]>

  export type $examPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "exam"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: $Enums.ExamName
      updated_at: Date
    }, ExtArgs["result"]["exam"]>
    composites: {}
  }

  type examGetPayload<S extends boolean | null | undefined | examDefaultArgs> = $Result.GetResult<Prisma.$examPayload, S>

  type examCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<examFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ExamCountAggregateInputType | true
    }

  export interface examDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['exam'], meta: { name: 'exam' } }
    /**
     * Find zero or one Exam that matches the filter.
     * @param {examFindUniqueArgs} args - Arguments to find a Exam
     * @example
     * // Get one Exam
     * const exam = await prisma.exam.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends examFindUniqueArgs>(args: SelectSubset<T, examFindUniqueArgs<ExtArgs>>): Prisma__examClient<$Result.GetResult<Prisma.$examPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Exam that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {examFindUniqueOrThrowArgs} args - Arguments to find a Exam
     * @example
     * // Get one Exam
     * const exam = await prisma.exam.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends examFindUniqueOrThrowArgs>(args: SelectSubset<T, examFindUniqueOrThrowArgs<ExtArgs>>): Prisma__examClient<$Result.GetResult<Prisma.$examPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Exam that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {examFindFirstArgs} args - Arguments to find a Exam
     * @example
     * // Get one Exam
     * const exam = await prisma.exam.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends examFindFirstArgs>(args?: SelectSubset<T, examFindFirstArgs<ExtArgs>>): Prisma__examClient<$Result.GetResult<Prisma.$examPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Exam that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {examFindFirstOrThrowArgs} args - Arguments to find a Exam
     * @example
     * // Get one Exam
     * const exam = await prisma.exam.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends examFindFirstOrThrowArgs>(args?: SelectSubset<T, examFindFirstOrThrowArgs<ExtArgs>>): Prisma__examClient<$Result.GetResult<Prisma.$examPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Exams that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {examFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Exams
     * const exams = await prisma.exam.findMany()
     * 
     * // Get first 10 Exams
     * const exams = await prisma.exam.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const examWithIdOnly = await prisma.exam.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends examFindManyArgs>(args?: SelectSubset<T, examFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$examPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Exam.
     * @param {examCreateArgs} args - Arguments to create a Exam.
     * @example
     * // Create one Exam
     * const Exam = await prisma.exam.create({
     *   data: {
     *     // ... data to create a Exam
     *   }
     * })
     * 
     */
    create<T extends examCreateArgs>(args: SelectSubset<T, examCreateArgs<ExtArgs>>): Prisma__examClient<$Result.GetResult<Prisma.$examPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Exams.
     * @param {examCreateManyArgs} args - Arguments to create many Exams.
     * @example
     * // Create many Exams
     * const exam = await prisma.exam.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends examCreateManyArgs>(args?: SelectSubset<T, examCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Exams and returns the data saved in the database.
     * @param {examCreateManyAndReturnArgs} args - Arguments to create many Exams.
     * @example
     * // Create many Exams
     * const exam = await prisma.exam.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Exams and only return the `id`
     * const examWithIdOnly = await prisma.exam.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends examCreateManyAndReturnArgs>(args?: SelectSubset<T, examCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$examPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Exam.
     * @param {examDeleteArgs} args - Arguments to delete one Exam.
     * @example
     * // Delete one Exam
     * const Exam = await prisma.exam.delete({
     *   where: {
     *     // ... filter to delete one Exam
     *   }
     * })
     * 
     */
    delete<T extends examDeleteArgs>(args: SelectSubset<T, examDeleteArgs<ExtArgs>>): Prisma__examClient<$Result.GetResult<Prisma.$examPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Exam.
     * @param {examUpdateArgs} args - Arguments to update one Exam.
     * @example
     * // Update one Exam
     * const exam = await prisma.exam.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends examUpdateArgs>(args: SelectSubset<T, examUpdateArgs<ExtArgs>>): Prisma__examClient<$Result.GetResult<Prisma.$examPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Exams.
     * @param {examDeleteManyArgs} args - Arguments to filter Exams to delete.
     * @example
     * // Delete a few Exams
     * const { count } = await prisma.exam.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends examDeleteManyArgs>(args?: SelectSubset<T, examDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Exams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {examUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Exams
     * const exam = await prisma.exam.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends examUpdateManyArgs>(args: SelectSubset<T, examUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Exams and returns the data updated in the database.
     * @param {examUpdateManyAndReturnArgs} args - Arguments to update many Exams.
     * @example
     * // Update many Exams
     * const exam = await prisma.exam.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Exams and only return the `id`
     * const examWithIdOnly = await prisma.exam.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends examUpdateManyAndReturnArgs>(args: SelectSubset<T, examUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$examPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Exam.
     * @param {examUpsertArgs} args - Arguments to update or create a Exam.
     * @example
     * // Update or create a Exam
     * const exam = await prisma.exam.upsert({
     *   create: {
     *     // ... data to create a Exam
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Exam we want to update
     *   }
     * })
     */
    upsert<T extends examUpsertArgs>(args: SelectSubset<T, examUpsertArgs<ExtArgs>>): Prisma__examClient<$Result.GetResult<Prisma.$examPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Exams.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {examCountArgs} args - Arguments to filter Exams to count.
     * @example
     * // Count the number of Exams
     * const count = await prisma.exam.count({
     *   where: {
     *     // ... the filter for the Exams we want to count
     *   }
     * })
    **/
    count<T extends examCountArgs>(
      args?: Subset<T, examCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ExamCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Exam.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExamAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ExamAggregateArgs>(args: Subset<T, ExamAggregateArgs>): Prisma.PrismaPromise<GetExamAggregateType<T>>

    /**
     * Group by Exam.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {examGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends examGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: examGroupByArgs['orderBy'] }
        : { orderBy?: examGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, examGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetExamGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the exam model
   */
  readonly fields: examFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for exam.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__examClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the exam model
   */
  interface examFieldRefs {
    readonly id: FieldRef<"exam", 'String'>
    readonly name: FieldRef<"exam", 'ExamName'>
    readonly updated_at: FieldRef<"exam", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * exam findUnique
   */
  export type examFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelect<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
    /**
     * Filter, which exam to fetch.
     */
    where: examWhereUniqueInput
  }

  /**
   * exam findUniqueOrThrow
   */
  export type examFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelect<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
    /**
     * Filter, which exam to fetch.
     */
    where: examWhereUniqueInput
  }

  /**
   * exam findFirst
   */
  export type examFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelect<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
    /**
     * Filter, which exam to fetch.
     */
    where?: examWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of exams to fetch.
     */
    orderBy?: examOrderByWithRelationInput | examOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for exams.
     */
    cursor?: examWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` exams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` exams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of exams.
     */
    distinct?: ExamScalarFieldEnum | ExamScalarFieldEnum[]
  }

  /**
   * exam findFirstOrThrow
   */
  export type examFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelect<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
    /**
     * Filter, which exam to fetch.
     */
    where?: examWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of exams to fetch.
     */
    orderBy?: examOrderByWithRelationInput | examOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for exams.
     */
    cursor?: examWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` exams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` exams.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of exams.
     */
    distinct?: ExamScalarFieldEnum | ExamScalarFieldEnum[]
  }

  /**
   * exam findMany
   */
  export type examFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelect<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
    /**
     * Filter, which exams to fetch.
     */
    where?: examWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of exams to fetch.
     */
    orderBy?: examOrderByWithRelationInput | examOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing exams.
     */
    cursor?: examWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` exams from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` exams.
     */
    skip?: number
    distinct?: ExamScalarFieldEnum | ExamScalarFieldEnum[]
  }

  /**
   * exam create
   */
  export type examCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelect<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
    /**
     * The data needed to create a exam.
     */
    data: XOR<examCreateInput, examUncheckedCreateInput>
  }

  /**
   * exam createMany
   */
  export type examCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many exams.
     */
    data: examCreateManyInput | examCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * exam createManyAndReturn
   */
  export type examCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
    /**
     * The data used to create many exams.
     */
    data: examCreateManyInput | examCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * exam update
   */
  export type examUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelect<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
    /**
     * The data needed to update a exam.
     */
    data: XOR<examUpdateInput, examUncheckedUpdateInput>
    /**
     * Choose, which exam to update.
     */
    where: examWhereUniqueInput
  }

  /**
   * exam updateMany
   */
  export type examUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update exams.
     */
    data: XOR<examUpdateManyMutationInput, examUncheckedUpdateManyInput>
    /**
     * Filter which exams to update
     */
    where?: examWhereInput
    /**
     * Limit how many exams to update.
     */
    limit?: number
  }

  /**
   * exam updateManyAndReturn
   */
  export type examUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
    /**
     * The data used to update exams.
     */
    data: XOR<examUpdateManyMutationInput, examUncheckedUpdateManyInput>
    /**
     * Filter which exams to update
     */
    where?: examWhereInput
    /**
     * Limit how many exams to update.
     */
    limit?: number
  }

  /**
   * exam upsert
   */
  export type examUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelect<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
    /**
     * The filter to search for the exam to update in case it exists.
     */
    where: examWhereUniqueInput
    /**
     * In case the exam found by the `where` argument doesn't exist, create a new exam with this data.
     */
    create: XOR<examCreateInput, examUncheckedCreateInput>
    /**
     * In case the exam was found with the provided `where` argument, update it with this data.
     */
    update: XOR<examUpdateInput, examUncheckedUpdateInput>
  }

  /**
   * exam delete
   */
  export type examDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelect<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
    /**
     * Filter which exam to delete.
     */
    where: examWhereUniqueInput
  }

  /**
   * exam deleteMany
   */
  export type examDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which exams to delete
     */
    where?: examWhereInput
    /**
     * Limit how many exams to delete.
     */
    limit?: number
  }

  /**
   * exam without action
   */
  export type examDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the exam
     */
    select?: examSelect<ExtArgs> | null
    /**
     * Omit specific fields from the exam
     */
    omit?: examOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    password: 'password',
    refersh_token: 'refersh_token',
    created_at: 'created_at',
    is_verified: 'is_verified'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const Student_profileScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    class: 'class',
    study_mode: 'study_mode',
    institution: 'institution',
    phone: 'phone',
    phone_country_code: 'phone_country_code',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type Student_profileScalarFieldEnum = (typeof Student_profileScalarFieldEnum)[keyof typeof Student_profileScalarFieldEnum]


  export const ExamScalarFieldEnum: {
    id: 'id',
    name: 'name',
    updated_at: 'updated_at'
  };

  export type ExamScalarFieldEnum = (typeof ExamScalarFieldEnum)[keyof typeof ExamScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Study_mode'
   */
  export type EnumStudy_modeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Study_mode'>
    


  /**
   * Reference to a field of type 'Study_mode[]'
   */
  export type ListEnumStudy_modeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Study_mode[]'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'ExamName'
   */
  export type EnumExamNameFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ExamName'>
    


  /**
   * Reference to a field of type 'ExamName[]'
   */
  export type ListEnumExamNameFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ExamName[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type userWhereInput = {
    AND?: userWhereInput | userWhereInput[]
    OR?: userWhereInput[]
    NOT?: userWhereInput | userWhereInput[]
    id?: StringFilter<"user"> | string
    name?: StringFilter<"user"> | string
    email?: StringFilter<"user"> | string
    password?: StringFilter<"user"> | string
    refersh_token?: StringNullableFilter<"user"> | string | null
    created_at?: DateTimeFilter<"user"> | Date | string
    is_verified?: BoolFilter<"user"> | boolean
    student_profile?: XOR<Student_profileNullableScalarRelationFilter, student_profileWhereInput> | null
  }

  export type userOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    refersh_token?: SortOrderInput | SortOrder
    created_at?: SortOrder
    is_verified?: SortOrder
    student_profile?: student_profileOrderByWithRelationInput
  }

  export type userWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    password?: string
    refersh_token?: string
    AND?: userWhereInput | userWhereInput[]
    OR?: userWhereInput[]
    NOT?: userWhereInput | userWhereInput[]
    name?: StringFilter<"user"> | string
    created_at?: DateTimeFilter<"user"> | Date | string
    is_verified?: BoolFilter<"user"> | boolean
    student_profile?: XOR<Student_profileNullableScalarRelationFilter, student_profileWhereInput> | null
  }, "id" | "email" | "password" | "refersh_token">

  export type userOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    refersh_token?: SortOrderInput | SortOrder
    created_at?: SortOrder
    is_verified?: SortOrder
    _count?: userCountOrderByAggregateInput
    _max?: userMaxOrderByAggregateInput
    _min?: userMinOrderByAggregateInput
  }

  export type userScalarWhereWithAggregatesInput = {
    AND?: userScalarWhereWithAggregatesInput | userScalarWhereWithAggregatesInput[]
    OR?: userScalarWhereWithAggregatesInput[]
    NOT?: userScalarWhereWithAggregatesInput | userScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"user"> | string
    name?: StringWithAggregatesFilter<"user"> | string
    email?: StringWithAggregatesFilter<"user"> | string
    password?: StringWithAggregatesFilter<"user"> | string
    refersh_token?: StringNullableWithAggregatesFilter<"user"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"user"> | Date | string
    is_verified?: BoolWithAggregatesFilter<"user"> | boolean
  }

  export type student_profileWhereInput = {
    AND?: student_profileWhereInput | student_profileWhereInput[]
    OR?: student_profileWhereInput[]
    NOT?: student_profileWhereInput | student_profileWhereInput[]
    id?: StringFilter<"student_profile"> | string
    user_id?: StringFilter<"student_profile"> | string
    class?: IntFilter<"student_profile"> | number
    study_mode?: EnumStudy_modeNullableFilter<"student_profile"> | $Enums.Study_mode | null
    institution?: StringNullableFilter<"student_profile"> | string | null
    phone?: BigIntNullableFilter<"student_profile"> | bigint | number | null
    phone_country_code?: StringNullableFilter<"student_profile"> | string | null
    created_at?: DateTimeFilter<"student_profile"> | Date | string
    updated_at?: DateTimeFilter<"student_profile"> | Date | string
    user?: XOR<UserScalarRelationFilter, userWhereInput>
  }

  export type student_profileOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    class?: SortOrder
    study_mode?: SortOrderInput | SortOrder
    institution?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    phone_country_code?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    user?: userOrderByWithRelationInput
  }

  export type student_profileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    user_id?: string
    phone?: bigint | number
    AND?: student_profileWhereInput | student_profileWhereInput[]
    OR?: student_profileWhereInput[]
    NOT?: student_profileWhereInput | student_profileWhereInput[]
    class?: IntFilter<"student_profile"> | number
    study_mode?: EnumStudy_modeNullableFilter<"student_profile"> | $Enums.Study_mode | null
    institution?: StringNullableFilter<"student_profile"> | string | null
    phone_country_code?: StringNullableFilter<"student_profile"> | string | null
    created_at?: DateTimeFilter<"student_profile"> | Date | string
    updated_at?: DateTimeFilter<"student_profile"> | Date | string
    user?: XOR<UserScalarRelationFilter, userWhereInput>
  }, "id" | "user_id" | "phone">

  export type student_profileOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    class?: SortOrder
    study_mode?: SortOrderInput | SortOrder
    institution?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    phone_country_code?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: student_profileCountOrderByAggregateInput
    _avg?: student_profileAvgOrderByAggregateInput
    _max?: student_profileMaxOrderByAggregateInput
    _min?: student_profileMinOrderByAggregateInput
    _sum?: student_profileSumOrderByAggregateInput
  }

  export type student_profileScalarWhereWithAggregatesInput = {
    AND?: student_profileScalarWhereWithAggregatesInput | student_profileScalarWhereWithAggregatesInput[]
    OR?: student_profileScalarWhereWithAggregatesInput[]
    NOT?: student_profileScalarWhereWithAggregatesInput | student_profileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"student_profile"> | string
    user_id?: StringWithAggregatesFilter<"student_profile"> | string
    class?: IntWithAggregatesFilter<"student_profile"> | number
    study_mode?: EnumStudy_modeNullableWithAggregatesFilter<"student_profile"> | $Enums.Study_mode | null
    institution?: StringNullableWithAggregatesFilter<"student_profile"> | string | null
    phone?: BigIntNullableWithAggregatesFilter<"student_profile"> | bigint | number | null
    phone_country_code?: StringNullableWithAggregatesFilter<"student_profile"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"student_profile"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"student_profile"> | Date | string
  }

  export type examWhereInput = {
    AND?: examWhereInput | examWhereInput[]
    OR?: examWhereInput[]
    NOT?: examWhereInput | examWhereInput[]
    id?: StringFilter<"exam"> | string
    name?: EnumExamNameFilter<"exam"> | $Enums.ExamName
    updated_at?: DateTimeFilter<"exam"> | Date | string
  }

  export type examOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    updated_at?: SortOrder
  }

  export type examWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: $Enums.ExamName
    AND?: examWhereInput | examWhereInput[]
    OR?: examWhereInput[]
    NOT?: examWhereInput | examWhereInput[]
    updated_at?: DateTimeFilter<"exam"> | Date | string
  }, "id" | "name">

  export type examOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    updated_at?: SortOrder
    _count?: examCountOrderByAggregateInput
    _max?: examMaxOrderByAggregateInput
    _min?: examMinOrderByAggregateInput
  }

  export type examScalarWhereWithAggregatesInput = {
    AND?: examScalarWhereWithAggregatesInput | examScalarWhereWithAggregatesInput[]
    OR?: examScalarWhereWithAggregatesInput[]
    NOT?: examScalarWhereWithAggregatesInput | examScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"exam"> | string
    name?: EnumExamNameWithAggregatesFilter<"exam"> | $Enums.ExamName
    updated_at?: DateTimeWithAggregatesFilter<"exam"> | Date | string
  }

  export type userCreateInput = {
    id?: string
    name: string
    email: string
    password: string
    refersh_token?: string | null
    created_at?: Date | string
    is_verified: boolean
    student_profile?: student_profileCreateNestedOneWithoutUserInput
  }

  export type userUncheckedCreateInput = {
    id?: string
    name: string
    email: string
    password: string
    refersh_token?: string | null
    created_at?: Date | string
    is_verified: boolean
    student_profile?: student_profileUncheckedCreateNestedOneWithoutUserInput
  }

  export type userUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    refersh_token?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_verified?: BoolFieldUpdateOperationsInput | boolean
    student_profile?: student_profileUpdateOneWithoutUserNestedInput
  }

  export type userUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    refersh_token?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_verified?: BoolFieldUpdateOperationsInput | boolean
    student_profile?: student_profileUncheckedUpdateOneWithoutUserNestedInput
  }

  export type userCreateManyInput = {
    id?: string
    name: string
    email: string
    password: string
    refersh_token?: string | null
    created_at?: Date | string
    is_verified: boolean
  }

  export type userUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    refersh_token?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_verified?: BoolFieldUpdateOperationsInput | boolean
  }

  export type userUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    refersh_token?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_verified?: BoolFieldUpdateOperationsInput | boolean
  }

  export type student_profileCreateInput = {
    id?: string
    class: number
    study_mode?: $Enums.Study_mode | null
    institution?: string | null
    phone?: bigint | number | null
    phone_country_code?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    user: userCreateNestedOneWithoutStudent_profileInput
  }

  export type student_profileUncheckedCreateInput = {
    id?: string
    user_id: string
    class: number
    study_mode?: $Enums.Study_mode | null
    institution?: string | null
    phone?: bigint | number | null
    phone_country_code?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type student_profileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    class?: IntFieldUpdateOperationsInput | number
    study_mode?: NullableEnumStudy_modeFieldUpdateOperationsInput | $Enums.Study_mode | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    phone_country_code?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: userUpdateOneRequiredWithoutStudent_profileNestedInput
  }

  export type student_profileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    class?: IntFieldUpdateOperationsInput | number
    study_mode?: NullableEnumStudy_modeFieldUpdateOperationsInput | $Enums.Study_mode | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    phone_country_code?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type student_profileCreateManyInput = {
    id?: string
    user_id: string
    class: number
    study_mode?: $Enums.Study_mode | null
    institution?: string | null
    phone?: bigint | number | null
    phone_country_code?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type student_profileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    class?: IntFieldUpdateOperationsInput | number
    study_mode?: NullableEnumStudy_modeFieldUpdateOperationsInput | $Enums.Study_mode | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    phone_country_code?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type student_profileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    class?: IntFieldUpdateOperationsInput | number
    study_mode?: NullableEnumStudy_modeFieldUpdateOperationsInput | $Enums.Study_mode | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    phone_country_code?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type examCreateInput = {
    id?: string
    name: $Enums.ExamName
    updated_at?: Date | string
  }

  export type examUncheckedCreateInput = {
    id?: string
    name: $Enums.ExamName
    updated_at?: Date | string
  }

  export type examUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: EnumExamNameFieldUpdateOperationsInput | $Enums.ExamName
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type examUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: EnumExamNameFieldUpdateOperationsInput | $Enums.ExamName
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type examCreateManyInput = {
    id?: string
    name: $Enums.ExamName
    updated_at?: Date | string
  }

  export type examUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: EnumExamNameFieldUpdateOperationsInput | $Enums.ExamName
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type examUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: EnumExamNameFieldUpdateOperationsInput | $Enums.ExamName
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type Student_profileNullableScalarRelationFilter = {
    is?: student_profileWhereInput | null
    isNot?: student_profileWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type userCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    refersh_token?: SortOrder
    created_at?: SortOrder
    is_verified?: SortOrder
  }

  export type userMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    refersh_token?: SortOrder
    created_at?: SortOrder
    is_verified?: SortOrder
  }

  export type userMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    refersh_token?: SortOrder
    created_at?: SortOrder
    is_verified?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type EnumStudy_modeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.Study_mode | EnumStudy_modeFieldRefInput<$PrismaModel> | null
    in?: $Enums.Study_mode[] | ListEnumStudy_modeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.Study_mode[] | ListEnumStudy_modeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumStudy_modeNullableFilter<$PrismaModel> | $Enums.Study_mode | null
  }

  export type BigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type UserScalarRelationFilter = {
    is?: userWhereInput
    isNot?: userWhereInput
  }

  export type student_profileCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    class?: SortOrder
    study_mode?: SortOrder
    institution?: SortOrder
    phone?: SortOrder
    phone_country_code?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type student_profileAvgOrderByAggregateInput = {
    class?: SortOrder
    phone?: SortOrder
  }

  export type student_profileMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    class?: SortOrder
    study_mode?: SortOrder
    institution?: SortOrder
    phone?: SortOrder
    phone_country_code?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type student_profileMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    class?: SortOrder
    study_mode?: SortOrder
    institution?: SortOrder
    phone?: SortOrder
    phone_country_code?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type student_profileSumOrderByAggregateInput = {
    class?: SortOrder
    phone?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type EnumStudy_modeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Study_mode | EnumStudy_modeFieldRefInput<$PrismaModel> | null
    in?: $Enums.Study_mode[] | ListEnumStudy_modeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.Study_mode[] | ListEnumStudy_modeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumStudy_modeNullableWithAggregatesFilter<$PrismaModel> | $Enums.Study_mode | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumStudy_modeNullableFilter<$PrismaModel>
    _max?: NestedEnumStudy_modeNullableFilter<$PrismaModel>
  }

  export type BigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type EnumExamNameFilter<$PrismaModel = never> = {
    equals?: $Enums.ExamName | EnumExamNameFieldRefInput<$PrismaModel>
    in?: $Enums.ExamName[] | ListEnumExamNameFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExamName[] | ListEnumExamNameFieldRefInput<$PrismaModel>
    not?: NestedEnumExamNameFilter<$PrismaModel> | $Enums.ExamName
  }

  export type examCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    updated_at?: SortOrder
  }

  export type examMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    updated_at?: SortOrder
  }

  export type examMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    updated_at?: SortOrder
  }

  export type EnumExamNameWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ExamName | EnumExamNameFieldRefInput<$PrismaModel>
    in?: $Enums.ExamName[] | ListEnumExamNameFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExamName[] | ListEnumExamNameFieldRefInput<$PrismaModel>
    not?: NestedEnumExamNameWithAggregatesFilter<$PrismaModel> | $Enums.ExamName
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumExamNameFilter<$PrismaModel>
    _max?: NestedEnumExamNameFilter<$PrismaModel>
  }

  export type student_profileCreateNestedOneWithoutUserInput = {
    create?: XOR<student_profileCreateWithoutUserInput, student_profileUncheckedCreateWithoutUserInput>
    connectOrCreate?: student_profileCreateOrConnectWithoutUserInput
    connect?: student_profileWhereUniqueInput
  }

  export type student_profileUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<student_profileCreateWithoutUserInput, student_profileUncheckedCreateWithoutUserInput>
    connectOrCreate?: student_profileCreateOrConnectWithoutUserInput
    connect?: student_profileWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type student_profileUpdateOneWithoutUserNestedInput = {
    create?: XOR<student_profileCreateWithoutUserInput, student_profileUncheckedCreateWithoutUserInput>
    connectOrCreate?: student_profileCreateOrConnectWithoutUserInput
    upsert?: student_profileUpsertWithoutUserInput
    disconnect?: student_profileWhereInput | boolean
    delete?: student_profileWhereInput | boolean
    connect?: student_profileWhereUniqueInput
    update?: XOR<XOR<student_profileUpdateToOneWithWhereWithoutUserInput, student_profileUpdateWithoutUserInput>, student_profileUncheckedUpdateWithoutUserInput>
  }

  export type student_profileUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<student_profileCreateWithoutUserInput, student_profileUncheckedCreateWithoutUserInput>
    connectOrCreate?: student_profileCreateOrConnectWithoutUserInput
    upsert?: student_profileUpsertWithoutUserInput
    disconnect?: student_profileWhereInput | boolean
    delete?: student_profileWhereInput | boolean
    connect?: student_profileWhereUniqueInput
    update?: XOR<XOR<student_profileUpdateToOneWithWhereWithoutUserInput, student_profileUpdateWithoutUserInput>, student_profileUncheckedUpdateWithoutUserInput>
  }

  export type userCreateNestedOneWithoutStudent_profileInput = {
    create?: XOR<userCreateWithoutStudent_profileInput, userUncheckedCreateWithoutStudent_profileInput>
    connectOrCreate?: userCreateOrConnectWithoutStudent_profileInput
    connect?: userWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableEnumStudy_modeFieldUpdateOperationsInput = {
    set?: $Enums.Study_mode | null
  }

  export type NullableBigIntFieldUpdateOperationsInput = {
    set?: bigint | number | null
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type userUpdateOneRequiredWithoutStudent_profileNestedInput = {
    create?: XOR<userCreateWithoutStudent_profileInput, userUncheckedCreateWithoutStudent_profileInput>
    connectOrCreate?: userCreateOrConnectWithoutStudent_profileInput
    upsert?: userUpsertWithoutStudent_profileInput
    connect?: userWhereUniqueInput
    update?: XOR<XOR<userUpdateToOneWithWhereWithoutStudent_profileInput, userUpdateWithoutStudent_profileInput>, userUncheckedUpdateWithoutStudent_profileInput>
  }

  export type EnumExamNameFieldUpdateOperationsInput = {
    set?: $Enums.ExamName
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumStudy_modeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.Study_mode | EnumStudy_modeFieldRefInput<$PrismaModel> | null
    in?: $Enums.Study_mode[] | ListEnumStudy_modeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.Study_mode[] | ListEnumStudy_modeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumStudy_modeNullableFilter<$PrismaModel> | $Enums.Study_mode | null
  }

  export type NestedBigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumStudy_modeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Study_mode | EnumStudy_modeFieldRefInput<$PrismaModel> | null
    in?: $Enums.Study_mode[] | ListEnumStudy_modeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.Study_mode[] | ListEnumStudy_modeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumStudy_modeNullableWithAggregatesFilter<$PrismaModel> | $Enums.Study_mode | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumStudy_modeNullableFilter<$PrismaModel>
    _max?: NestedEnumStudy_modeNullableFilter<$PrismaModel>
  }

  export type NestedBigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumExamNameFilter<$PrismaModel = never> = {
    equals?: $Enums.ExamName | EnumExamNameFieldRefInput<$PrismaModel>
    in?: $Enums.ExamName[] | ListEnumExamNameFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExamName[] | ListEnumExamNameFieldRefInput<$PrismaModel>
    not?: NestedEnumExamNameFilter<$PrismaModel> | $Enums.ExamName
  }

  export type NestedEnumExamNameWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ExamName | EnumExamNameFieldRefInput<$PrismaModel>
    in?: $Enums.ExamName[] | ListEnumExamNameFieldRefInput<$PrismaModel>
    notIn?: $Enums.ExamName[] | ListEnumExamNameFieldRefInput<$PrismaModel>
    not?: NestedEnumExamNameWithAggregatesFilter<$PrismaModel> | $Enums.ExamName
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumExamNameFilter<$PrismaModel>
    _max?: NestedEnumExamNameFilter<$PrismaModel>
  }

  export type student_profileCreateWithoutUserInput = {
    id?: string
    class: number
    study_mode?: $Enums.Study_mode | null
    institution?: string | null
    phone?: bigint | number | null
    phone_country_code?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type student_profileUncheckedCreateWithoutUserInput = {
    id?: string
    class: number
    study_mode?: $Enums.Study_mode | null
    institution?: string | null
    phone?: bigint | number | null
    phone_country_code?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type student_profileCreateOrConnectWithoutUserInput = {
    where: student_profileWhereUniqueInput
    create: XOR<student_profileCreateWithoutUserInput, student_profileUncheckedCreateWithoutUserInput>
  }

  export type student_profileUpsertWithoutUserInput = {
    update: XOR<student_profileUpdateWithoutUserInput, student_profileUncheckedUpdateWithoutUserInput>
    create: XOR<student_profileCreateWithoutUserInput, student_profileUncheckedCreateWithoutUserInput>
    where?: student_profileWhereInput
  }

  export type student_profileUpdateToOneWithWhereWithoutUserInput = {
    where?: student_profileWhereInput
    data: XOR<student_profileUpdateWithoutUserInput, student_profileUncheckedUpdateWithoutUserInput>
  }

  export type student_profileUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    class?: IntFieldUpdateOperationsInput | number
    study_mode?: NullableEnumStudy_modeFieldUpdateOperationsInput | $Enums.Study_mode | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    phone_country_code?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type student_profileUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    class?: IntFieldUpdateOperationsInput | number
    study_mode?: NullableEnumStudy_modeFieldUpdateOperationsInput | $Enums.Study_mode | null
    institution?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    phone_country_code?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type userCreateWithoutStudent_profileInput = {
    id?: string
    name: string
    email: string
    password: string
    refersh_token?: string | null
    created_at?: Date | string
    is_verified: boolean
  }

  export type userUncheckedCreateWithoutStudent_profileInput = {
    id?: string
    name: string
    email: string
    password: string
    refersh_token?: string | null
    created_at?: Date | string
    is_verified: boolean
  }

  export type userCreateOrConnectWithoutStudent_profileInput = {
    where: userWhereUniqueInput
    create: XOR<userCreateWithoutStudent_profileInput, userUncheckedCreateWithoutStudent_profileInput>
  }

  export type userUpsertWithoutStudent_profileInput = {
    update: XOR<userUpdateWithoutStudent_profileInput, userUncheckedUpdateWithoutStudent_profileInput>
    create: XOR<userCreateWithoutStudent_profileInput, userUncheckedCreateWithoutStudent_profileInput>
    where?: userWhereInput
  }

  export type userUpdateToOneWithWhereWithoutStudent_profileInput = {
    where?: userWhereInput
    data: XOR<userUpdateWithoutStudent_profileInput, userUncheckedUpdateWithoutStudent_profileInput>
  }

  export type userUpdateWithoutStudent_profileInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    refersh_token?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_verified?: BoolFieldUpdateOperationsInput | boolean
  }

  export type userUncheckedUpdateWithoutStudent_profileInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    refersh_token?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    is_verified?: BoolFieldUpdateOperationsInput | boolean
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}