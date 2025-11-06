-- AlterTable
ALTER TABLE `Comment` MODIFY `content` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Ingredient` MODIFY `name` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `Recipe` MODIFY `title` VARCHAR(255) NOT NULL,
    MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Step` MODIFY `text` TEXT NOT NULL;
