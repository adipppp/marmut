import { PrismaClient } from "@prisma/client";

async function cleanup(prisma: PrismaClient) {
    await prisma.song.deleteMany();
    await prisma.$disconnect();
}

export const prisma = new PrismaClient();

process.on("beforeExit", async () => {
    await cleanup(prisma);
});

process.on("SIGINT", async () => {
    await cleanup(prisma);
    process.exit();
});

process.on("uncaughtException", async (err) => {
    console.error(err);
    await cleanup(prisma);
    process.exit(1);
});
