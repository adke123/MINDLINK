/*
  Warnings:

  - You are about to drop the column `description` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Memory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Memory" DROP COLUMN "description",
DROP COLUMN "title",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT '기타',
ADD COLUMN     "content" TEXT;

-- CreateTable
CREATE TABLE "MemoryComment" (
    "id" SERIAL NOT NULL,
    "memoryId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MemoryComment" ADD CONSTRAINT "MemoryComment_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryComment" ADD CONSTRAINT "MemoryComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
