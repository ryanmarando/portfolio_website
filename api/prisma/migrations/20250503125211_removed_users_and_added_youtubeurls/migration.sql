/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "YoutubeUrls" (
    "id" SERIAL NOT NULL,
    "titles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "urls" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "YoutubeUrls_pkey" PRIMARY KEY ("id")
);
