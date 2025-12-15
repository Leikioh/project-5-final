-- DropForeignKey
ALTER TABLE `Comment` DROP FOREIGN KEY `Comment_recipeId_fkey`;

-- DropForeignKey
ALTER TABLE `CommentLike` DROP FOREIGN KEY `CommentLike_commentId_fkey`;

-- DropForeignKey
ALTER TABLE `Favorite` DROP FOREIGN KEY `Favorite_recipeId_fkey`;

-- DropForeignKey
ALTER TABLE `Ingredient` DROP FOREIGN KEY `Ingredient_recipeId_fkey`;

-- DropIndex
DROP INDEX `Comment_recipeId_fkey` ON `Comment`;

-- DropIndex
DROP INDEX `CommentLike_commentId_fkey` ON `CommentLike`;

-- DropIndex
DROP INDEX `Favorite_recipeId_fkey` ON `Favorite`;

-- DropIndex
DROP INDEX `Ingredient_recipeId_fkey` ON `Ingredient`;

-- AddForeignKey
ALTER TABLE `Ingredient` ADD CONSTRAINT `Ingredient_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentLike` ADD CONSTRAINT `CommentLike_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
