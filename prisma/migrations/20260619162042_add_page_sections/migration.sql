/*
  Warnings:

  - A unique constraint covering the columns `[Name]` on the table `ViewTypes` will be added. If there are existing duplicate values, this will fail.
  - Made the column `SiteID` on table `Files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `SiteID` on table `Pages` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Files` DROP FOREIGN KEY `Files_SiteID_fkey`;

-- DropForeignKey
ALTER TABLE `Pages` DROP FOREIGN KEY `Pages_SiteID_fkey`;

-- AlterTable
ALTER TABLE `Files` MODIFY `SiteID` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Pages` MODIFY `SiteID` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `SiteMenus` ADD COLUMN `target` VARCHAR(20) NULL,
    ADD COLUMN `url` VARCHAR(500) NULL;

-- CreateTable
CREATE TABLE `PageSections` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `PageID` INTEGER NOT NULL,
    `Type` VARCHAR(50) NOT NULL,
    `Title` VARCHAR(200) NULL,
    `BodyJson` JSON NULL,
    `SortOrder` INTEGER NOT NULL DEFAULT 0,
    `IsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    INDEX `PageSections_PageID_idx`(`PageID`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ViewTypes_Name_key` ON `ViewTypes`(`Name`);

-- AddForeignKey
ALTER TABLE `Pages` ADD CONSTRAINT `Pages_SiteID_fkey` FOREIGN KEY (`SiteID`) REFERENCES `Sites`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Files` ADD CONSTRAINT `Files_SiteID_fkey` FOREIGN KEY (`SiteID`) REFERENCES `Sites`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PageSections` ADD CONSTRAINT `PageSections_PageID_fkey` FOREIGN KEY (`PageID`) REFERENCES `Pages`(`ID`) ON DELETE CASCADE ON UPDATE CASCADE;
