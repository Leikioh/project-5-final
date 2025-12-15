-- DropForeignKey
ALTER TABLE `Step` DROP FOREIGN KEY `Step_recipeId_fkey`;

-- DropIndex
DROP INDEX `Step_recipeId_fkey` ON `Step`;

-- AddForeignKey
ALTER TABLE `Step` ADD CONSTRAINT `Step_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
