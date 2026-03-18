-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubAccessToken" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
