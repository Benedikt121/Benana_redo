/*
  Warnings:

  - Added the required column `gamesPool` to the `Olympiade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Olympiade` ADD COLUMN `gamesPool` JSON NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `isReady` BOOLEAN NOT NULL DEFAULT false;
