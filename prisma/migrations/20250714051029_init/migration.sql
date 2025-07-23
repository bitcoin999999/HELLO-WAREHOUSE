-- CreateTable
CREATE TABLE "Shelf" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Level" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "shelfId" INTEGER NOT NULL,
    CONSTRAINT "Level_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "arrivalDate" DATETIME NOT NULL,
    "remark" TEXT,
    "shelfId" INTEGER NOT NULL,
    "levelId" INTEGER NOT NULL,
    CONSTRAINT "Item_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Shelf_number_key" ON "Shelf"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Level_shelfId_number_key" ON "Level"("shelfId", "number");

-- CreateIndex
CREATE INDEX "Item_name_idx" ON "Item"("name");
