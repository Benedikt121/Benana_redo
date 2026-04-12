-- DropIndex
DROP INDEX `User_spotifyId_key` ON `User`;

-- AlterTable
ALTER TABLE `User` MODIFY `appleMusicUserToken` TEXT NULL,
    MODIFY `spotifyRefreshToken` TEXT NULL;
