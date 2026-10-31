-- Fail before any persistent DDL when legacy data needs an explicit human choice.
-- Ownerless sites cannot be assigned safely, and duplicate file paths cannot be
-- renamed without coordinating the corresponding file on disk.
CREATE TEMPORARY TABLE `_SiteOwnerPreflight` (
    `createdById` INTEGER NOT NULL
);
INSERT INTO `_SiteOwnerPreflight` (`createdById`)
SELECT `createdById` FROM `Sites`;
DROP TEMPORARY TABLE `_SiteOwnerPreflight`;

CREATE TEMPORARY TABLE `_FilePathPreflight` (
    `path` VARCHAR(500) NOT NULL,
    UNIQUE INDEX `_FilePathPreflight_path_key` (`path`)
);
INSERT INTO `_FilePathPreflight` (`path`)
SELECT `Path` FROM `Files`;
DROP TEMPORARY TABLE `_FilePathPreflight`;

-- Stable view-type codes are application infrastructure, not user-created content.
INSERT INTO `ViewTypes` (`Name`, `Description`) VALUES
    ('home', '網站首頁'),
    ('page', '一般內容頁'),
    ('pdf', 'PDF／附件頁'),
    ('parent', '純選單群組'),
    ('external', '外部連結')
ON DUPLICATE KEY UPDATE `Description` = VALUES(`Description`);

-- Existing invalid scalar states are normalized before CHECK constraints are added.
UPDATE `Users` SET `role` = 1 WHERE `role` <> 1;
UPDATE `Pages` SET `Status` = 0 WHERE `Status` NOT IN (0, 1);
UPDATE `PageSections` SET `SortOrder` = 0 WHERE `SortOrder` < 0;
UPDATE `SiteMenus` SET `sortOrder` = 0 WHERE `sortOrder` < 0;
UPDATE `SiteMenus` SET `target` = NULL WHERE `target` NOT IN ('_self', '_blank');
UPDATE `SiteMenus`
SET `viewTypeId` = (SELECT `ID` FROM `ViewTypes` WHERE `Name` = 'parent')
WHERE `viewTypeId` IS NULL;

UPDATE `PageSections`
SET `Type` = CASE
    WHEN `Type` = 'text' THEN 'richText'
    WHEN `Type` = 'banner' THEN 'carousel'
    WHEN `Type` IN ('richText', 'table', 'carousel', 'announcement') THEN `Type`
    ELSE 'richText'
END;

UPDATE `PageSections`
SET `BodyJson` = CASE `Type`
    WHEN 'richText' THEN JSON_OBJECT('contentHtml', '', 'textAlign', 'left', 'maxWidth', '960px')
    WHEN 'table' THEN JSON_OBJECT('columns', JSON_ARRAY(), 'rows', JSON_ARRAY(), 'striped', true, 'bordered', true)
    WHEN 'carousel' THEN JSON_OBJECT('images', JSON_ARRAY(), 'autoplay', true, 'interval', 5000, 'showArrows', true, 'showDots', true)
    WHEN 'announcement' THEN JSON_OBJECT('limit', 5, 'showDate', true, 'showMoreButton', true)
END
WHERE `BodyJson` IS NULL;

-- Normalize route slugs. External links and grouping menus do not consume a route slug.
ALTER TABLE `SiteMenus` DROP INDEX `SiteMenus_siteId_activeSlug_key`;

UPDATE `SiteMenus` AS menu
INNER JOIN `ViewTypes` AS view_type ON view_type.`ID` = menu.`viewTypeId`
SET menu.`slug` = NULL
WHERE LOWER(view_type.`Name`) IN ('external', 'parent');

UPDATE `SiteMenus`
SET `slug` = CONCAT(
    '/',
    TRIM(BOTH '-' FROM REGEXP_REPLACE(
        TRIM(LEADING '/' FROM TRIM(`slug`)),
        '[^[:alnum:]_-]+',
        '-'
    ))
)
WHERE `slug` IS NOT NULL;

UPDATE `SiteMenus`
SET `slug` = CONCAT('/menu-', `id`)
WHERE `slug` = '/' OR `slug` = '';

CREATE TEMPORARY TABLE `_DuplicateActiveMenuSlugs` (
    `id` INTEGER NOT NULL PRIMARY KEY,
    `duplicate_number` INTEGER NOT NULL
);

INSERT INTO `_DuplicateActiveMenuSlugs` (`id`, `duplicate_number`)
SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `siteId`, `slug` ORDER BY `id`)
FROM `SiteMenus`
WHERE `isDeleted` = false AND `slug` IS NOT NULL;

UPDATE `SiteMenus` AS menu
INNER JOIN `_DuplicateActiveMenuSlugs` AS duplicate_menu ON duplicate_menu.`id` = menu.`id`
SET menu.`slug` = CONCAT(LEFT(menu.`slug`, 180), '-', menu.`id`)
WHERE duplicate_menu.duplicate_number > 1;

DROP TEMPORARY TABLE `_DuplicateActiveMenuSlugs`;

UPDATE `SiteMenus`
SET `activeSlug` = CASE
    WHEN `isDeleted` = false AND `slug` IS NOT NULL THEN `slug`
    ELSE NULL
END;

-- The legacy FK uses ON DELETE SET NULL, so it must be removed before making
-- viewTypeId required.
ALTER TABLE `SiteMenus` DROP FOREIGN KEY `SiteMenus_viewTypeId_fkey`;

ALTER TABLE `SiteMenus`
    MODIFY `slug` VARCHAR(200) NULL,
    MODIFY `viewTypeId` INTEGER NOT NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedById` INTEGER NULL,
    ADD UNIQUE INDEX `SiteMenus_siteId_activeSlug_key` (`siteId`, `activeSlug`),
    ADD UNIQUE INDEX `SiteMenus_siteId_id_key` (`siteId`, `id`),
    ADD UNIQUE INDEX `SiteMenus_siteId_pageId_key` (`siteId`, `pageId`),
    ADD INDEX `SiteMenus_deletedById_idx` (`deletedById`),
    ADD INDEX `SiteMenus_public_order_idx` (`siteId`, `isDeleted`, `isEnabled`, `sortOrder`, `id`);

ALTER TABLE `SiteMenus`
    ADD CONSTRAINT `SiteMenus_deletedById_fkey`
        FOREIGN KEY (`deletedById`) REFERENCES `Users` (`ID`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `SiteMenus_viewTypeId_fkey`
        FOREIGN KEY (`viewTypeId`) REFERENCES `ViewTypes` (`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE `SiteMenus`
SET `deletedAt` = `updatedAt`
WHERE `isDeleted` = true;

-- A site must retain a real owner. This intentionally fails if legacy ownerless sites
-- exist so they can be assigned deliberately rather than silently transferred.
ALTER TABLE `Sites` DROP FOREIGN KEY `Sites_createdById_fkey`;
ALTER TABLE `Sites` MODIFY `createdById` INTEGER NOT NULL;
ALTER TABLE `Sites` ADD CONSTRAINT `Sites_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `Users` (`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- File metadata and explicit visibility. Legacy news assets remain public for
-- compatibility; other records default to private unless explicitly published.
ALTER TABLE `Files`
    MODIFY `Name` VARCHAR(255) NOT NULL,
    MODIFY `Path` VARCHAR(500) NOT NULL,
    ADD COLUMN `Category` VARCHAR(20) NOT NULL DEFAULT 'file',
    ADD COLUMN `MimeType` VARCHAR(150) NULL,
    ADD COLUMN `SizeBytes` INTEGER NULL,
    ADD COLUMN `Sha256` CHAR(64) NULL,
    ADD COLUMN `IsPublic` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `UpdatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `DeletedAt` DATETIME(3) NULL,
    ADD COLUMN `DeletedBy` INTEGER NULL;

UPDATE `Files`
SET `Category` = CASE
    WHEN `Path` LIKE '/uploads/pages/%' THEN 'page'
    WHEN `Path` LIKE '/uploads/news/%' THEN 'news'
    ELSE 'file'
END,
`IsPublic` = CASE WHEN `Path` LIKE '/uploads/news/%' THEN true ELSE false END;

UPDATE `Files` AS file
LEFT JOIN `Users` AS uploader ON uploader.`ID` = file.`UploadedBy`
SET file.`UploadedBy` = NULL
WHERE file.`UploadedBy` IS NOT NULL AND uploader.`ID` IS NULL;

ALTER TABLE `Files`
    ADD UNIQUE INDEX `Files_Path_key` (`Path`),
    ADD UNIQUE INDEX `Files_SiteID_ID_key` (`SiteID`, `ID`),
    ADD INDEX `Files_UploadedBy_idx` (`UploadedBy`),
    ADD INDEX `Files_DeletedBy_idx` (`DeletedBy`),
    ADD INDEX `Files_visibility_idx` (`SiteID`, `IsPublic`, `DeletedAt`),
    ADD CONSTRAINT `Files_UploadedBy_fkey`
        FOREIGN KEY (`UploadedBy`) REFERENCES `Users` (`ID`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `Files_DeletedBy_fkey`
        FOREIGN KEY (`DeletedBy`) REFERENCES `Users` (`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Pages`
    ADD COLUMN `ArchivedAt` DATETIME(3) NULL,
    ADD COLUMN `ArchivedBy` INTEGER NULL,
    ADD UNIQUE INDEX `Pages_SiteID_ID_key` (`SiteID`, `ID`),
    ADD INDEX `Pages_ArchivedBy_idx` (`ArchivedBy`),
    ADD CONSTRAINT `Pages_ArchivedBy_fkey`
        FOREIGN KEY (`ArchivedBy`) REFERENCES `Users` (`ID`) ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE `Pages`
SET `ArchivedAt` = `UpdatedAt`
WHERE `Status` = 0;

ALTER TABLE `PageSections`
    ADD UNIQUE INDEX `PageSections_PageID_ID_key` (`PageID`, `ID`);

CREATE TABLE `PageFiles` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `SiteID` INTEGER NOT NULL,
    `PageID` INTEGER NOT NULL,
    `FileID` INTEGER NOT NULL,
    `SectionID` INTEGER NULL,
    `Usage` VARCHAR(30) NOT NULL DEFAULT 'attachment',
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `PageFiles_PageID_FileID_Usage_SectionID_key` (`PageID`, `FileID`, `Usage`, `SectionID`),
    INDEX `PageFiles_FileID_idx` (`FileID`),
    INDEX `PageFiles_SectionID_idx` (`SectionID`),
    INDEX `PageFiles_SiteID_idx` (`SiteID`),
    PRIMARY KEY (`ID`),
    CONSTRAINT `PageFiles_PageID_fkey` FOREIGN KEY (`SiteID`, `PageID`) REFERENCES `Pages` (`SiteID`, `ID`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `PageFiles_FileID_fkey` FOREIGN KEY (`SiteID`, `FileID`) REFERENCES `Files` (`SiteID`, `ID`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `PageFiles_SectionID_fkey` FOREIGN KEY (`PageID`, `SectionID`) REFERENCES `PageSections` (`PageID`, `ID`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `PageFiles` (`SiteID`, `PageID`, `FileID`, `Usage`)
SELECT page.`SiteID`, page.`ID`, page.`RelatedFileID`, 'attachment'
FROM `Pages` AS page
INNER JOIN `Files` AS file ON file.`ID` = page.`RelatedFileID` AND file.`SiteID` = page.`SiteID`
WHERE page.`RelatedFileID` IS NOT NULL;

INSERT IGNORE INTO `PageFiles` (`SiteID`, `PageID`, `FileID`, `Usage`)
SELECT page.`SiteID`, page.`ID`, file.`ID`, 'editor'
FROM `Pages` AS page
INNER JOIN `Files` AS file ON file.`SiteID` = page.`SiteID`
WHERE page.`Content` LIKE CONCAT('%/api/file/content/', file.`ID`, '%')
   OR page.`Content` LIKE CONCAT('%', file.`Path`, '%');

-- Disconnect legacy cross-site pointers before installing composite FKs. The owning
-- records remain available for audit instead of being reassigned to another tenant.
UPDATE `SiteMenus` AS child
INNER JOIN `SiteMenus` AS parent ON parent.`id` = child.`parentId`
SET child.`parentId` = NULL
WHERE child.`siteId` <> parent.`siteId`;

UPDATE `SiteMenus` AS menu
INNER JOIN `Pages` AS page ON page.`ID` = menu.`pageId`
SET menu.`pageId` = NULL
WHERE menu.`siteId` <> page.`SiteID`;

UPDATE `Pages` AS page
INNER JOIN `Files` AS file ON file.`ID` = page.`RelatedFileID`
SET page.`RelatedFileID` = NULL
WHERE page.`SiteID` <> file.`SiteID`;

-- Cross-site relations are rejected by composite foreign keys.
ALTER TABLE `SiteMenus` DROP FOREIGN KEY `SiteMenus_parentId_fkey`;
ALTER TABLE `SiteMenus` DROP FOREIGN KEY `SiteMenus_pageId_fkey`;
ALTER TABLE `Pages` DROP FOREIGN KEY `Pages_RelatedFileID_fkey`;

ALTER TABLE `SiteMenus`
    ADD CONSTRAINT `SiteMenus_parent_site_fkey`
        FOREIGN KEY (`siteId`, `parentId`) REFERENCES `SiteMenus` (`siteId`, `id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
    ADD CONSTRAINT `SiteMenus_page_site_fkey`
        FOREIGN KEY (`siteId`, `pageId`) REFERENCES `Pages` (`SiteID`, `ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `Pages`
    ADD CONSTRAINT `Pages_primary_file_site_fkey`
        FOREIGN KEY (`SiteID`, `RelatedFileID`) REFERENCES `Files` (`SiteID`, `ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `PageSections`
    MODIFY `BodyJson` JSON NOT NULL,
    ADD INDEX `PageSections_public_order_idx` (`PageID`, `IsEnabled`, `SortOrder`, `ID`),
    ADD CONSTRAINT `PageSections_type_check` CHECK (`Type` IN ('richText', 'table', 'carousel', 'announcement')),
    ADD CONSTRAINT `PageSections_sort_order_check` CHECK (`SortOrder` >= 0);

ALTER TABLE `Users`
    ADD CONSTRAINT `Users_role_check` CHECK (`role` = 1);

ALTER TABLE `Pages`
    ADD CONSTRAINT `Pages_status_check` CHECK (`Status` IN (0, 1)),
    ADD CONSTRAINT `Pages_archive_audit_check` CHECK (
        (`Status` = 1 AND `ArchivedAt` IS NULL)
        OR (`Status` = 0 AND `ArchivedAt` IS NOT NULL)
    );

ALTER TABLE `SiteMenus`
    ADD CONSTRAINT `SiteMenus_target_check` CHECK (
        (`url` IS NULL AND `target` IS NULL)
        OR (`url` IS NOT NULL
            AND `target` IN ('_self', '_blank')
            AND `url` REGEXP '^(https?://|mailto:|tel:)')
    ),
    ADD CONSTRAINT `SiteMenus_sort_order_check` CHECK (`sortOrder` >= 0),
    ADD CONSTRAINT `SiteMenus_delete_audit_check` CHECK (
        (`isDeleted` = true AND `deletedAt` IS NOT NULL)
        OR (`isDeleted` = false AND `deletedAt` IS NULL)
    ),
    ADD CONSTRAINT `SiteMenus_active_slug_check` CHECK (
        (`isDeleted` = true AND `activeSlug` IS NULL)
        OR (`isDeleted` = false AND `slug` IS NULL AND `activeSlug` IS NULL)
        OR (`isDeleted` = false AND `slug` IS NOT NULL AND `activeSlug` = `slug`)
    ),
    ADD CONSTRAINT `SiteMenus_slug_shape_check` CHECK (
        `slug` IS NULL
        OR (CHAR_LENGTH(`slug`) > 1
            AND LEFT(`slug`, 1) = '/'
            AND SUBSTRING(`slug`, 2) REGEXP '^[[:alnum:]_-]+$')
    );

ALTER TABLE `Files`
    ADD CONSTRAINT `Files_category_check` CHECK (`Category` IN ('file', 'page', 'news', 'editor')),
    ADD CONSTRAINT `Files_size_check` CHECK (`SizeBytes` IS NULL OR `SizeBytes` BETWEEN 1 AND 10485760);

ALTER TABLE `PageFiles`
    ADD CONSTRAINT `PageFiles_usage_check` CHECK (`Usage` IN ('attachment', 'editor', 'section'));

CREATE TABLE `Announcements` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `SiteID` INTEGER NOT NULL,
    `Title` VARCHAR(200) NOT NULL,
    `Content` MEDIUMTEXT NULL,
    `IsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `PublishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ExpiresAt` DATETIME(3) NULL,
    `CreatedBy` INTEGER NULL,
    `UpdatedBy` INTEGER NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,
    `DeletedAt` DATETIME(3) NULL,
    `DeletedBy` INTEGER NULL,
    INDEX `Announcements_public_idx` (`SiteID`, `IsEnabled`, `DeletedAt`, `PublishedAt`),
    INDEX `Announcements_DeletedBy_idx` (`DeletedBy`),
    PRIMARY KEY (`ID`),
    CONSTRAINT `Announcements_SiteID_fkey` FOREIGN KEY (`SiteID`) REFERENCES `Sites` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Announcements_CreatedBy_fkey` FOREIGN KEY (`CreatedBy`) REFERENCES `Users` (`ID`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `Announcements_UpdatedBy_fkey` FOREIGN KEY (`UpdatedBy`) REFERENCES `Users` (`ID`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `Announcements_DeletedBy_fkey` FOREIGN KEY (`DeletedBy`) REFERENCES `Users` (`ID`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
