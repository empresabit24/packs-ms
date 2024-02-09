import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTables1707241534318 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear la tabla "packs"
    console.log(`Create PACKS Table`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sch_main"."packs" (
        "idpack" SERIAL PRIMARY KEY,
        "idproducto" INT NOT NULL,
        "creationdate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Crear la tabla "productospack"
    console.log(`Create PRODUCTOSPACK Table`);
    await queryRunner.query(`
       CREATE TABLE IF NOT EXISTS "sch_main"."productospack" (  
       "idproductopack" SERIAL PRIMARY KEY,
       "idpack" INT NOT NULL,
       "idproducto" INT NOT NULL,
       "productquantity" INT NOT NULL
      );
    `);

    // Agregar clave foránea en la tabla "packs" que referencia la tabla "productos"
    await queryRunner.query(`
      ALTER TABLE "sch_main"."packs"
      ADD CONSTRAINT "FK_idproducto_packs"
      FOREIGN KEY ("idproducto")
      REFERENCES "sch_main"."productos"("idproducto")
    `);

    // Agregar clave foránea en la tabla "productospack" que referencia la tabla "packs"
    await queryRunner.query(`
      ALTER TABLE "sch_main"."productospack"
      ADD CONSTRAINT "FK_idpack"
      FOREIGN KEY ("idpack")
      REFERENCES "sch_main"."packs"("idpack")
    `);

    console.log('AGREGAR ID en tabla tiposmovimiento');
    await queryRunner.query(`
    INSERT INTO "sch_main"."tiposmovimiento" ("idtipomovimiento", "description", "isactive", "createdat", "code")
    VALUES
    (16, 'PACK: Creación de un pack', 1, '2024-01-22 11:45:00.15978+00', 'CREATE_PACK'),
    (17, 'PACK: Desarmado de un pack', 1, '2024-01-29 11:45:00.15978+00', 'UNPACK')
    ON CONFLICT ("idtipomovimiento") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir la inserción en la tabla "tiposmovimiento"
    await queryRunner.query(`
    DELETE FROM "sch_main"."tiposmovimiento"
    WHERE "idtipomovimiento" IN (16, 17)
  `);

    // Eliminar la clave foránea en la tabla "productospack"
    await queryRunner.query(`
    ALTER TABLE "sch_main"."productospack"
    DROP CONSTRAINT IF EXISTS "FK_idpack"
  `);

    // Eliminar la clave foránea en la tabla "packs"
    await queryRunner.query(`
    ALTER TABLE "sch_main"."packs"
    DROP CONSTRAINT IF EXISTS "FK_idproducto_packs"
  `);

    // Eliminar la tabla "productospack"
    await queryRunner.query(`
    DROP TABLE IF EXISTS "sch_main"."productospack"
  `);

    // Eliminar la tabla "packs"
    await queryRunner.query(`
    DROP TABLE IF EXISTS "sch_main"."packs"
  `);
  }
}
