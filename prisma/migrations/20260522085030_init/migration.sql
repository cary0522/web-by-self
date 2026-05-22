-- CreateTable
CREATE TABLE `Users` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `account` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `role` INTEGER NOT NULL DEFAULT 1,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Users_account_key`(`account`),
    UNIQUE INDEX `Users_email_key`(`email`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `domain` VARCHAR(255) NOT NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Sites_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteMenus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `siteId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,
    `pageId` INTEGER NULL,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `viewTypeId` INTEGER NULL,
    `icon` VARCHAR(100) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `isParent` BOOLEAN NOT NULL DEFAULT false,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `SiteMenus_siteId_idx`(`siteId`),
    INDEX `SiteMenus_parentId_idx`(`parentId`),
    INDEX `SiteMenus_pageId_idx`(`pageId`),
    INDEX `SiteMenus_createdById_idx`(`createdById`),
    INDEX `SiteMenus_isDeleted_idx`(`isDeleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pages` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Title` VARCHAR(200) NOT NULL,
    `Content` MEDIUMTEXT NULL,
    `Status` TINYINT NOT NULL DEFAULT 1,
    `RelatedFileID` INTEGER NULL,
    `CreatedBy` INTEGER NULL,
    `UpdatedBy` INTEGER NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,
    `SiteID` INTEGER NULL,

    INDEX `Pages_SiteID_idx`(`SiteID`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Files` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(191) NOT NULL,
    `Path` VARCHAR(191) NOT NULL,
    `UploadedBy` INTEGER NULL,
    `UploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `SiteID` INTEGER NULL,

    INDEX `Files_SiteID_idx`(`SiteID`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ViewTypes` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `Name` VARCHAR(50) NOT NULL,
    `Description` VARCHAR(255) NULL,

    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Sites` ADD CONSTRAINT `Sites_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `Users`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteMenus` ADD CONSTRAINT `SiteMenus_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Sites`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteMenus` ADD CONSTRAINT `SiteMenus_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `SiteMenus`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `SiteMenus` ADD CONSTRAINT `SiteMenus_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `Pages`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteMenus` ADD CONSTRAINT `SiteMenus_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `Users`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteMenus` ADD CONSTRAINT `SiteMenus_viewTypeId_fkey` FOREIGN KEY (`viewTypeId`) REFERENCES `ViewTypes`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pages` ADD CONSTRAINT `Pages_RelatedFileID_fkey` FOREIGN KEY (`RelatedFileID`) REFERENCES `Files`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pages` ADD CONSTRAINT `Pages_CreatedBy_fkey` FOREIGN KEY (`CreatedBy`) REFERENCES `Users`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pages` ADD CONSTRAINT `Pages_UpdatedBy_fkey` FOREIGN KEY (`UpdatedBy`) REFERENCES `Users`(`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pages` ADD CONSTRAINT `Pages_SiteID_fkey` FOREIGN KEY (`SiteID`) REFERENCES `Sites`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Files` ADD CONSTRAINT `Files_SiteID_fkey` FOREIGN KEY (`SiteID`) REFERENCES `Sites`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
