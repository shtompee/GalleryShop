CREATE TABLE "painting" (
  "id" INTEGER  PRIMARY KEY NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "prod_year" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "paint_size" VARCHAR(30) NOT NULL,
  "sale_status" SMALLINT NOT NULL,
  "techlogy" VARCHAR(200) NOT NULL,
  "list_image" BYTEA NOT NULL,
  "full_image" BYTEA NOT NULL,
  "prod_date" DATE NOT NULL,
  "is_purchased" SMALLINT NOT NULL DEFAULT '0'
);

COMMENT ON COLUMN "painting"."id" IS '';
COMMENT ON COLUMN "painting"."name" IS '';
COMMENT ON COLUMN "painting"."prod_year" IS '';
COMMENT ON COLUMN "painting"."price" IS '';
COMMENT ON COLUMN "painting"."paint_size" IS '';
COMMENT ON COLUMN "painting"."sale_status" IS '';
COMMENT ON COLUMN "painting"."techlogy" IS '';
COMMENT ON COLUMN "painting"."list_image" IS '';
COMMENT ON COLUMN "painting"."full_image" IS '';
COMMENT ON COLUMN "painting"."prod_date" IS '';
COMMENT ON COLUMN "painting"."is_purchased" IS '';

CREATE SEQUENCE id_seq START 100 INCREMENT 1 MINVALUE 100;