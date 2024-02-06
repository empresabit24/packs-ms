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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "sch_main"."productospack";
      DROP TABLE IF EXISTS "sch_main"."packs";
    `);
  }
}
