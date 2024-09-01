import { migrate } from "drizzle-orm/node-postgres/migrator";
import Fastify, {
	FastifyInstance,
	type FastifyReply,
	type FastifyRequest,
} from "fastify";
import { logger } from "./utils/logger";
import { buildServer } from "./utils/server";
import { env } from "./config/env";
import { db } from "./db";

async function gracefulShutdown({
	app,
}: {
	app: Awaited<ReturnType<typeof buildServer>>;
}) {
	await app.close();
}

async function main() {
	const app = await buildServer();



	app.get(
		"/",
		async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
			try {
				// console.log(request.user.role)
				reply.code(200).send({ message: "Hi from the backend" });
			} catch (err) {
				request.log.error(err);
				reply.code(500).send({ error: "Internal Server Error" });
			}
		},
	);

	app.listen({
		port: env.PORT,
		host: env.HOST,
	});

	await migrate(db, {
		migrationsFolder: "./migrations",
	});

	const signals = ["SIGINT", "SIGTERM"];

	logger.debug(env, "using env");

	for (const signal of signals) {
		process.on(signal, () => {
			console.log("Got Signal", signal);
			gracefulShutdown({ 
				app,
			});
		});
	}
}

main();

// server.get(
//   '/',
//   async (
//     request: FastifyRequest,
//     reply: FastifyReply
//   ): Promise<void> => {
//     try {
//       reply.code(200).send({ message: 'Hi from the backend' });
//     } catch (err) {
//       request.log.error(err);
//       reply.code(500).send({ error: 'Internal Server Error' });
//     }
//   }
// );

// server.setNotFoundHandler(
//   (
//     request: FastifyRequest,
//     reply: FastifyReply
//   ): void => {
//     reply.code(404).send({ error: 'Resource not found' });
//   }
// );

// const start = async (): Promise<void> => {
//   try {
//     await server.listen({ port: 3000 });
//     console.log("hii")
//     server.log.info(`Server listening on port 3000`);
//   } catch (err) {
//     server.log.error(err);
//     process.exit(1);
//   }
// };

// start();
