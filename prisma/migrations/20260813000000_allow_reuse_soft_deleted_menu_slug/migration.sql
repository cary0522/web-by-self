-- Stage normalized domains first. The UNIQUE constraint makes the migration fail
-- before changing Sites when legacy values such as "foo" and "/foo" collide.
CREATE TEMPORARY TABLE `_NormalizedSiteDomains` (
    `id` INTEGER NOT NULL,
    `domain` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `_NormalizedSiteDomains_domain_key` (`domain`),
    CONSTRAINT `_NormalizedSiteDomains_domain_not_empty` CHECK (CHAR_LENGTH(`domain`) > 1)
);

INSERT INTO `_NormalizedSiteDomains` (`id`, `domain`)
SELECT `id`, CONCAT('/', TRIM(LEADING '/' FROM TRIM(`domain`)))
FROM `Sites`;

UPDATE `Sites`
INNER JOIN `_NormalizedSiteDomains` ON `_NormalizedSiteDomains`.`id` = `Sites`.`id`
SET `Sites`.`domain` = `_NormalizedSiteDomains`.`domain`;

DROP TEMPORARY TABLE `_NormalizedSiteDomains`;

CREATE UNIQUE INDEX `Sites_domain_key` ON `Sites`(`domain`);

-- Keep the original slug for audit/restore purposes, while enforcing uniqueness
-- only for menus that have not been soft deleted.
ALTER TABLE `SiteMenus`
    DROP INDEX `SiteMenus_siteId_slug_key`,
    ADD COLUMN `activeSlug` VARCHAR(200) NULL;

UPDATE `SiteMenus`
SET `activeSlug` = CASE
    WHEN `isDeleted` = false THEN `slug`
    ELSE NULL
END;

CREATE UNIQUE INDEX `SiteMenus_siteId_activeSlug_key`
    ON `SiteMenus`(`siteId`, `activeSlug`);
