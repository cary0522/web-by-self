-- Add unique relation between SiteMenu and Page
ALTER TABLE `SiteMenus` ADD UNIQUE INDEX `SiteMenus_pageId_key`(`pageId`);
