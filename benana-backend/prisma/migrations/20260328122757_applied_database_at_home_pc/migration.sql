-- DropForeignKey
ALTER TABLE `Friendship` DROP FOREIGN KEY `Friendship_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `Friendship` DROP FOREIGN KEY `Friendship_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `Invitation` DROP FOREIGN KEY `Invitation_receiverId_fkey`;

-- DropForeignKey
ALTER TABLE `Invitation` DROP FOREIGN KEY `Invitation_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `Invitation` DROP FOREIGN KEY `Invitation_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `KniffelGame` DROP FOREIGN KEY `KniffelGame_matchId_fkey`;

-- DropForeignKey
ALTER TABLE `KniffelTurn` DROP FOREIGN KEY `KniffelTurn_kniffelGameId_fkey`;

-- DropForeignKey
ALTER TABLE `KniffelTurn` DROP FOREIGN KEY `KniffelTurn_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Match` DROP FOREIGN KEY `Match_olympiadeId_fkey`;

-- DropForeignKey
ALTER TABLE `Match` DROP FOREIGN KEY `Match_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `MatchResult` DROP FOREIGN KEY `MatchResult_matchId_fkey`;

-- DropForeignKey
ALTER TABLE `MatchResult` DROP FOREIGN KEY `MatchResult_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Olympiade` DROP FOREIGN KEY `Olympiade_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `Room` DROP FOREIGN KEY `Room_hostId_fkey`;

-- DropIndex
DROP INDEX `Friendship_receiverId_fkey` ON `Friendship`;

-- DropIndex
DROP INDEX `Invitation_receiverId_fkey` ON `Invitation`;

-- DropIndex
DROP INDEX `Invitation_roomId_fkey` ON `Invitation`;

-- DropIndex
DROP INDEX `Invitation_senderId_fkey` ON `Invitation`;

-- DropIndex
DROP INDEX `KniffelTurn_kniffelGameId_fkey` ON `KniffelTurn`;

-- DropIndex
DROP INDEX `KniffelTurn_userId_fkey` ON `KniffelTurn`;

-- DropIndex
DROP INDEX `Match_olympiadeId_fkey` ON `Match`;

-- DropIndex
DROP INDEX `Match_roomId_fkey` ON `Match`;

-- DropIndex
DROP INDEX `MatchResult_matchId_fkey` ON `MatchResult`;

-- DropIndex
DROP INDEX `MatchResult_userId_fkey` ON `MatchResult`;

-- DropIndex
DROP INDEX `Olympiade_roomId_fkey` ON `Olympiade`;

-- DropIndex
DROP INDEX `Room_hostId_fkey` ON `Room`;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Friendship` ADD CONSTRAINT `Friendship_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_olympiadeId_fkey` FOREIGN KEY (`olympiadeId`) REFERENCES `Olympiade`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchResult` ADD CONSTRAINT `MatchResult_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchResult` ADD CONSTRAINT `MatchResult_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Olympiade` ADD CONSTRAINT `Olympiade_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KniffelGame` ADD CONSTRAINT `KniffelGame_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KniffelTurn` ADD CONSTRAINT `KniffelTurn_kniffelGameId_fkey` FOREIGN KEY (`kniffelGameId`) REFERENCES `KniffelGame`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KniffelTurn` ADD CONSTRAINT `KniffelTurn_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
