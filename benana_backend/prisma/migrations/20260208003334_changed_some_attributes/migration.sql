/*
  Warnings:

  - You are about to drop the column `orderIndex` on the `Match` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Room_inviteCode_key` ON `Room`;

-- AlterTable
ALTER TABLE `Match` DROP COLUMN `orderIndex`;
