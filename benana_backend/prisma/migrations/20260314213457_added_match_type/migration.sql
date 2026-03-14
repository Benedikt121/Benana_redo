/*
  Warnings:

  - Added the required column `matchGameId` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Match` ADD COLUMN `matchGameId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `MatchGame` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MatchGame_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_matchGameId_fkey` FOREIGN KEY (`matchGameId`) REFERENCES `MatchGame`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
