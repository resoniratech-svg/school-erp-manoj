import { Prisma } from '@prisma/client';

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  model: {
    $allModels: {
      async softDelete<T, A>(
        this: T,
        where: Prisma.Args<T, 'update'>['where']
      ): Promise<Prisma.Result<T, A, 'update'>> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where,
          data: {
            deletedAt: new Date(),
          },
        });
      },

      async findManyActive<T, A>(
        this: T,
        args?: Prisma.Args<T, 'findMany'>
      ): Promise<Prisma.Result<T, A, 'findMany'>> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).findMany({
          ...args,
          where: {
            ...args?.where,
            deletedAt: null,
          },
        });
      },

      async findFirstActive<T, A>(
        this: T,
        args?: Prisma.Args<T, 'findFirst'>
      ): Promise<Prisma.Result<T, A, 'findFirst'>> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).findFirst({
          ...args,
          where: {
            ...args?.where,
            deletedAt: null,
          },
        });
      },
    },
  },
});

export type SoftDeleteMethods = {
  softDelete: <T>(where: Prisma.Args<T, 'update'>['where']) => Promise<T>;
  findManyActive: <T>(args?: Prisma.Args<T, 'findMany'>) => Promise<T[]>;
  findFirstActive: <T>(args?: Prisma.Args<T, 'findFirst'>) => Promise<T | null>;
};
