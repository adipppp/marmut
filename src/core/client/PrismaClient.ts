import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

async function cleanup() {
    await prisma.song.deleteMany();
    await prisma.$disconnect();
}

process.on("beforeExit", async () => {
    await cleanup();
});

process.on("SIGINT", async () => {
    await cleanup();
    process.exit();
});

process.on("uncaughtException", async (err) => {
    console.error(err);
    await cleanup();
    process.exit(1);
});
