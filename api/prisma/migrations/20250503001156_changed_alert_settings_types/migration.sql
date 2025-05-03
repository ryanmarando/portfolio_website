/*
  Warnings:

  - The `alertListAlertTypes` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `alertListCounties` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `alertListNWSOffices` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "alertListAlertTypes",
ADD COLUMN     "alertListAlertTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "alertListCounties",
ADD COLUMN     "alertListCounties" JSONB,
DROP COLUMN "alertListNWSOffices",
ADD COLUMN     "alertListNWSOffices" TEXT[] DEFAULT ARRAY[]::TEXT[];
