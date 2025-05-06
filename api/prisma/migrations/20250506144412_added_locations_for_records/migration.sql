/*
  Warnings:

  - The primary key for the `ModelTrend` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `ModelTrend` table. All the data in the column will be lost.
  - The `id` column on the `ModelTrend` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[modelName,location,runTime,validTime,parameter]` on the table `ModelTrend` will be added. If there are existing duplicate values, this will fail.
  - Made the column `location` on table `ModelTrend` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ModelTrend_modelName_runTime_forecastHour_parameter_idx";

-- DropIndex
DROP INDEX "ModelTrend_modelName_runTime_validTime_parameter_key";

-- AlterTable
ALTER TABLE "ModelTrend" DROP CONSTRAINT "ModelTrend_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "location" SET NOT NULL,
ADD CONSTRAINT "ModelTrend_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "ModelTrend_modelName_location_runTime_validTime_parameter_key" ON "ModelTrend"("modelName", "location", "runTime", "validTime", "parameter");
