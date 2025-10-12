.PHONY: db-generate db-push db-migrate-dev db-migrate-deploy db-studio db-seed db-reset

db-generate:
	npx prisma generate

db-push:
	npx prisma db push

db-migrate-dev:
	npx prisma migrate dev

db-migrate-deploy:
	npx prisma migrate deploy

db-studio:
	npx prisma studio

db-seed:
	npx prisma db seed

db-reset:
	npx prisma migrate reset
