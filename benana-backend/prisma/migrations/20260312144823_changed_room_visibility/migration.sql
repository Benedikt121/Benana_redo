/*
  Warnings:

  - You are about to drop the column `isPublic` on the `Room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Room` DROP COLUMN `isPublic`,
    ADD COLUMN `whoCanJoin` ENUM('PUBLIC', 'INVITE_ONLY', 'FRIENDS_ONLY') NOT NULL DEFAULT 'PUBLIC';
