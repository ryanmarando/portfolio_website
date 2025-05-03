-- CreateTable
CREATE TABLE "ModelTrend" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "runTime" TIMESTAMP(3) NOT NULL,
    "forecastHour" INTEGER NOT NULL,
    "validTime" TIMESTAMP(3) NOT NULL,
    "parameter" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelTrend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModelTrend_modelName_runTime_forecastHour_parameter_idx" ON "ModelTrend"("modelName", "runTime", "forecastHour", "parameter");
