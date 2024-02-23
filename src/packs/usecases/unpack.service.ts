import { Injectable, Logger } from '@nestjs/common';
import {
  movimientos,
  productos,
  productoslocal,
  stockproductostienda,
} from '../../infraestructure/microservice/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { packs } from '../entities/pack.entity';
import { Repository } from 'typeorm';
import { productospack } from '../entities/productospack.entity';

@Injectable()
export class UnpackService {
  private readonly logger = new Logger('UnpackService');

  constructor(
    @InjectRepository(productos)
    private productosRepository: Repository<productos>,

    @InjectRepository(packs)
    private readonly packsRepository: Repository<packs>,

    @InjectRepository(productoslocal)
    private productosLocalRepository: Repository<productoslocal>,

    @InjectRepository(stockproductostienda)
    private stockProductosTiendaRepository: Repository<stockproductostienda>,

    @InjectRepository(movimientos)
    private readonly movimientosRepository: Repository<movimientos>,

    @InjectRepository(productospack)
    private readonly productosPackRepository: Repository<productospack>,
  ) {}

  async unpack(idpack: number, idlocal: number) {
    try {
      // OBTENEMOS EL idproducto DEL PACK A DESARMAR
      const { idproducto } = await this.packsRepository
        .createQueryBuilder('pack')
        .select(['pack.idpack', 'pack.idproducto'])
        .where('pack.idpack = :idpack', { idpack })
        .getOne();

      // OBTENEMOS EL NOMBRE DEL PACK:
      const packName = await this.getNameProducto(idproducto);

      /*// Cambiar el estado del idproducto a inactivo
            await this.productosRepository
              .createQueryBuilder()
              .update(productos)
              .set({
                idestado: 4,
              })
              .where('idproducto = :idproducto', { idproducto: idproducto })
              .execute();*/

      //DEJAMOS CON STOCK 0 AL PACK A DESARMAR
      const { idproductolocal } = await this.productosLocalRepository
        .createQueryBuilder('productoslocal')
        .select(['productoslocal.idproductolocal'])
        .where('productoslocal.idproducto = :idproducto', {
          idproducto: idproducto,
        })
        .andWhere('productoslocal.idlocal = :idlocal', {
          idlocal: idlocal,
        })
        .getOne();

      const { stock, idstockproductotienda } =
        await this.stockProductosTiendaRepository
          .createQueryBuilder('stockproductostienda')
          .where('stockproductostienda.idproductolocal = :idproductolocal', {
            idproductolocal,
          })
          .getOne();

      await this.stockProductosTiendaRepository
        .createQueryBuilder()
        .update(stockproductostienda)
        .set({
          stock: 0,
          stock_unidades: 0,
          stock_presentacion: 0,
        })
        .where('idproductolocal = :idproductolocal', { idproductolocal })
        .execute();

      // AGREGAR A MOVIMIENTOS EL NUEVO STOCK DEL PACK
      await this.movimientosRepository
        .createQueryBuilder()
        .insert()
        .into(movimientos)
        .values([
          {
            idtipomovimiento: 17,
            idstockproductotienda: idstockproductotienda,
            salida: stock,
            entrada: null,
            idusuario: 1,
            stockfinal: 0,
            detalle: `{"tipo": "UNPACK", "PACK": "${packName}"}`,
          },
        ])
        .execute();

      // DEVOLUCIÓN DE PRODUCTOS
      const productsInPack = await this.productosPackRepository
        .createQueryBuilder('productospack')
        .select(['productospack.idproducto', 'productospack.productquantity'])
        .where('productospack.idpack = :idpack', { idpack })
        .getMany();

      console.log(productsInPack);

      for (let i = 0; i < productsInPack.length; i++) {
        const producto = productsInPack[i];
        const productoPackInfo = await this.productosLocalRepository
          .createQueryBuilder('productolocal')
          .where('productolocal.idproducto = :idproducto', {
            idproducto: producto.idproducto,
          })
          .andWhere('productolocal.idlocal = :idlocal', { idlocal })
          .getOne();
        console.log(productoPackInfo);

        await this.stockProductosTiendaRepository
          .createQueryBuilder()
          .update(stockproductostienda)
          .set({
            stock: () => `stock + :stockQuantity`,
            stock_unidades: () => `stock_unidades + :stockQuantity`,
            stock_presentacion: () => `stock_presentacion + :stockQuantity`,
          })
          .where('idproductolocal = :idproductolocal', {
            idproductolocal: productoPackInfo.idproductolocal,
          })
          .setParameter('stockQuantity', stock * producto.productquantity)
          .execute();
        this.logger.log(`PRODUCTO CON ID ${producto.idproducto} LISTO `);

        const updateProductoPackInfo = await this.stockProductosTiendaRepository
          .createQueryBuilder('stockproductostienda')
          .where('stockproductostienda.idproductolocal = :idproductolocal', {
            idproducto: producto.idproducto,
          })
          .where('idproductolocal = :idproductolocal', {
            idproductolocal: productoPackInfo.idproductolocal,
          })
          .getOne();
        console.log(updateProductoPackInfo);

        // AGREGAR MOVIMIENTO
        try {
          this.logger.log('AGREGANDO MOVIMIENTOS');
          console.log(producto);
          const sumaStockFinal =
            Number(stock * producto.productquantity) +
            Number(updateProductoPackInfo.stock);

          await this.movimientosRepository
            .createQueryBuilder()
            .insert()
            .into(movimientos)
            .values([
              {
                idtipomovimiento: 17,
                idstockproductotienda:
                  updateProductoPackInfo.idstockproductotienda,
                salida: null,
                entrada: stock * producto.productquantity,
                idusuario: 1,
                stockfinal: sumaStockFinal,
                detalle: `{"tipo": "UNPACK", "PACK": "${packName}"}`,
              },
            ])
            .execute();
          this.logger.log(
            `PRODUCTO CON ID ${producto.idproducto} AGREGADO A MOVIMIENTOS `,
          );
        } catch (error) {
          this.logger.error('Error al desarmar el pack:', error.message);
          throw error;
        }
      }
    } catch (error) {
      this.logger.error('Error al desarmar el pack:', error.message);
      throw error;
    }
  }

  async getNameProducto(idProducto: number) {
    const { producto } = await this.productosRepository
      .createQueryBuilder('productos')
      .select(['productos.producto'])
      .where('productos.idproducto = :idproducto', {
        idproducto: idProducto,
      })
      .getOne();

    return producto;
  }
}
