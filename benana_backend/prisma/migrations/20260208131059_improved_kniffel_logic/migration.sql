/*
  Warnings:

  - You are about to drop the column `type` on the `GameDefinition` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `KniffelTurn` table. All the data in the column will be lost.
  - Added the required column `kniffelGameId` to the `KniffelTurn` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `KniffelTurn` DROP FOREIGN KEY `KniffelTurn_matchId_fkey`;

-- DropIndex
DROP INDEX `KniffelTurn_matchId_fkey` ON `KniffelTurn`;

-- AlterTable
ALTER TABLE `GameDefinition` DROP COLUMN `type`;

-- AlterTable
ALTER TABLE `KniffelTurn` DROP COLUMN `matchId`,
    ADD COLUMN `kniffelGameId` VARCHAR(191) NOT NULL,
    MODIFY `rolls` JSON NULL;

-- AlterTable
ALTER TABLE `Match` MODIFY `status` ENUM('PENDING', 'ACTIVE', 'FINISHED', 'ABORTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `User` ADD COLUMN `color` VARCHAR(191) NOT NULL DEFAULT '#ffffff';

-- CreateTable
CREATE TABLE `KniffelGame` (
    `id` VARCHAR(191) NOT NULL,
    `isAnalog` BOOLEAN NOT NULL DEFAULT false,
    `matchId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `KniffelGame_matchId_key`(`matchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `KniffelGame` ADD CONSTRAINT `KniffelGame_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KniffelTurn` ADD CONSTRAINT `KniffelTurn_kniffelGameId_fkey` FOREIGN KEY (`kniffelGameId`) REFERENCES `KniffelGame`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
