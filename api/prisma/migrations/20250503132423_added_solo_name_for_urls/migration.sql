/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `YoutubeUrls` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `YoutubeUrls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "YoutubeUrls" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeUrls_name_key" ON "YoutubeUrls"("name");
