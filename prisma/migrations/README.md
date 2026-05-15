# Database migrations

Prisma generates migration SQL from `prisma/schema.prisma`. On first install,
run the bootstrap once:

```bash
pnpm bootstrap   # = prisma generate && prisma migrate dev --name init && pnpm db:seed
```

This creates `prisma/migrations/<timestamp>_init/migration.sql`, applies it to
your database, and commits the demo tenant + IUAS chart of accounts.

In production:

```bash
pnpm db:deploy   # = prisma migrate deploy (applies committed migrations only)
```

Never run `prisma db push` against production — it skips the migration log.

## Schema changes

After editing `schema.prisma`:

```bash
pnpm db:migrate --name describe_change   # generates + applies migration
git add prisma/migrations
```

Commit both the schema change and the generated SQL.
