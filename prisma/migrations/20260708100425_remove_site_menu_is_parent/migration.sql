/*
  Warnings:

  - You are about to drop the column `isParent` on the `SiteMenus` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[siteId,slug]` on the table `SiteMenus` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `SiteMenus` DROP COLUMN `isParent`;

-- CreateIndex
CREATE UNIQUE INDEX `SiteMenus_siteId_slug_key` ON `SiteMenus`(`siteId`, `slug`);
