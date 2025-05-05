/*
  Warnings:

  - A unique constraint covering the columns `[modelName,runTime,validTime,parameter]` on the table `ModelTrend` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ModelTrend_modelName_runTime_validTime_parameter_key" ON "ModelTrend"("modelName", "runTime", "validTime", "parameter");
